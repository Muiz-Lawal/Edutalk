import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { showToast } from '../utils/toastManager';

const clampDays = (classData, days) => {
  const min = Math.max(1, Number(classData.minPurchaseDays || 1));
  const max = classData.durationType === 'ongoing'
    ? 30
    : Math.max(0, Math.min(30, Number(classData.daysRemaining || classData.remainingDays || classData.maxPurchaseDays || 30)));
  return Math.min(Math.max(Number(days) || min, min), max);
};

export const useCartStore = create(persist((set, get) => ({
  lines: [],
  pulse: false,
  addLine: (classData, days = classData.minPurchaseDays || 1) => {
    if (!classData?._id) return;
    const nextDays = clampDays(classData, days);
    if (nextDays < 1) {
      showToast({ type: 'error', title: 'Unavailable', message: 'This class is no longer available.' });
      return;
    }
    set((state) => {
      const existing = state.lines.find((line) => line.classId === classData._id);
      const lines = existing
        ? state.lines.map((line) => line.classId === classData._id ? { ...line, days: nextDays } : line)
        : state.lines.length >= 10 ? state.lines : [...state.lines, { classId: classData._id, days: nextDays }];
      if (!existing && state.lines.length >= 10) {
        showToast({ type: 'error', title: 'Cart limit reached', message: 'You can checkout up to 10 classes at once.' });
        return state;
      }
      return { lines, pulse: true };
    });
    window.setTimeout(() => set({ pulse: false }), 500);
  },
  updateDays: (classData, days) => set((state) => ({
    lines: state.lines.map((line) => line.classId === classData._id ? { ...line, days: clampDays(classData, days) } : line),
  })),
  removeLine: (classId) => set((state) => ({ lines: state.lines.filter((line) => line.classId !== classId) })),
  replaceLines: (lines) => set({ lines: Array.isArray(lines) ? lines.slice(0, 10) : [] }),
  clear: () => set({ lines: [] }),
}), { name: 'edutalk_cart_v1' }));
