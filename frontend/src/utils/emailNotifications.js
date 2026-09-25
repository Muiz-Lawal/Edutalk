import api from './api';

const notify = (path, data) => api.post(path, data).then(({ data: result }) => ({ success: true, data: result }));
const failure = (label, error) => { console.error(`${label} notification error:`, error); return { success: false, error: error.message }; };
const safe = (label, operation) => operation().catch((error) => failure(label, error));

export const emailNotificationService = {
  sendAchievementNotification: (userId, achievement) => safe('Achievement', () => notify('/notifications/email/achievement', { userId, achievement: { type: achievement.type, title: achievement.title, description: achievement.description, icon: achievement.icon, unlockedAt: new Date() } })),
  sendCompletionNotification: (userId, courseData) => safe('Completion', () => notify('/notifications/email/completion', { userId, course: { name: courseData.name, completedAt: new Date(), certificateId: courseData.certificateId, score: courseData.score } })),
  sendMilestoneNotification: (userId, milestone) => safe('Milestone', () => notify('/notifications/email/milestone', { userId, milestone: { type: milestone.type, title: milestone.title, description: milestone.description, reward: milestone.reward, reachedAt: new Date() } })),
  sendProgressReminder: (userId, enrollmentData) => safe('Reminder', () => notify('/notifications/email/reminder', { userId, enrollment: enrollmentData })),
  sendCertificateNotification: (userId, certificateData) => safe('Certificate', () => notify('/notifications/email/certificate', { userId, certificate: certificateData })),
  subscribeToNotifications: (userId, preferences) => safe('Subscription', () => notify('/notifications/subscribe', { userId, preferences: { achievements: preferences.achievements !== false, milestones: preferences.milestones !== false, completions: preferences.completions !== false, reminders: preferences.reminders !== false, certificates: preferences.certificates !== false, frequency: preferences.frequency || 'instant' } })),
  getNotificationPreferences: () => safe('Preferences', async () => { const { data } = await api.get('/notifications/preferences'); return { success: true, data }; }),
};

export default emailNotificationService;
