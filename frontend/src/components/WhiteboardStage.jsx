import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Circle, Eraser, MousePointer2, Pen, Pencil, Redo2, Square, Trash2, Type, Undo2,
} from 'lucide-react';
import {
  addWhiteboardStroke, clearWhiteboard, loadWhiteboard, setStudentsCanDraw, subscribeWhiteboard,
} from '../lib/whiteboard';

const colors = ['#FFFFFF', '#6366F1', '#10B981', '#F59E0B', '#F43F5E', '#94A3B8'];
const widths = [2, 5, 10];
const tools = [
  ['select', MousePointer2, 'Select'], ['pen', Pen, 'Pen'], ['marker', Pencil, 'Marker'],
  ['eraser', Eraser, 'Eraser'], ['rect', Square, 'Rectangle'], ['ellipse', Circle, 'Ellipse'],
  ['line', Pencil, 'Line'], ['text', Type, 'Text'],
];

function drawStroke(context, stroke, scaleX, scaleY) {
  if (!stroke.points?.length) return;
  context.save();
  context.strokeStyle = stroke.tool === 'eraser' ? '#111827' : stroke.color;
  context.fillStyle = stroke.color;
  context.lineWidth = stroke.width;
  context.globalAlpha = stroke.tool === 'marker' ? 0.45 : 1;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  if (stroke.tool === 'text' || stroke.tool === 'sticky') {
    context.font = `${Math.max(14, stroke.width * 6)}px Inter, sans-serif`;
    context.fillText(stroke.text || 'Text', stroke.points[0].x * scaleX, stroke.points[0].y * scaleY);
  } else {
    context.beginPath();
    context.moveTo(stroke.points[0].x * scaleX, stroke.points[0].y * scaleY);
    stroke.points.slice(1).forEach((point) => context.lineTo(point.x * scaleX, point.y * scaleY));
    context.stroke();
  }
  context.restore();
}

export default function WhiteboardStage({ sessionId, isHost, layout, onClose }) {
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const drawingRef = useRef(null);
  const [strokes, setStrokes] = useState([]);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState(colors[0]);
  const [width, setWidth] = useState(widths[0]);
  const [studentsCanDraw, setStudentsCanDrawState] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [redo, setRedo] = useState([]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const rect = stage.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const context = canvas.getContext('2d');
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.fillStyle = '#111827';
    context.fillRect(0, 0, rect.width, rect.height);
    strokes.forEach((stroke) => drawStroke(context, stroke, rect.width / 1000, rect.height / 600));
  }, [strokes]);

  useEffect(() => {
    let active = true;
    loadWhiteboard(sessionId).then((state) => {
      if (!active) return;
      setStrokes(state.strokes || []);
      setStudentsCanDrawState(Boolean(state.studentsCanDraw));
    }).catch(() => setError('We could not load the whiteboard. Please retry.'));
    const unsubscribe = subscribeWhiteboard(sessionId, (event) => {
      if (event.type === 'stroke' && event.stroke) setStrokes((items) => items.some((item) => item.id === event.stroke.id) ? items : [...items, event.stroke]);
      if (event.type === 'clear') setStrokes([]);
      if (event.type === 'permission') setStudentsCanDrawState(Boolean(event.studentsCanDraw));
    });
    return () => { active = false; unsubscribe(); };
  }, [sessionId]);

  useEffect(() => {
    redraw();
    const observer = new ResizeObserver(redraw);
    if (stageRef.current) observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, [redraw]);

  const pointFromEvent = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * 1000, y: ((event.clientY - rect.top) / rect.height) * 600 };
  };
  const startDrawing = (event) => {
    if (tool === 'select' || (!isHost && !studentsCanDraw)) return;
    drawingRef.current = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, tool, color, width, points: [pointFromEvent(event)] };
    canvasRef.current.setPointerCapture(event.pointerId);
  };
  const continueDrawing = (event) => {
    if (!drawingRef.current) return;
    drawingRef.current.points.push(pointFromEvent(event));
    redraw();
    const context = canvasRef.current.getContext('2d');
    const rect = canvasRef.current.getBoundingClientRect();
    drawStroke(context, drawingRef.current, rect.width / 1000, rect.height / 600);
  };
  const finishDrawing = async () => {
    if (!drawingRef.current) return;
    const stroke = drawingRef.current;
    drawingRef.current = null;
    setStrokes((items) => [...items, stroke]);
    setHistory((items) => [...items, stroke]);
    setRedo([]);
    try { await addWhiteboardStroke(sessionId, stroke); } catch { setError('Your drawing could not be saved. Please retry.'); }
  };
  const undo = () => {
    const last = history.at(-1);
    if (!last) return;
    setHistory((items) => items.slice(0, -1));
    setRedo((items) => [...items, last]);
    setStrokes((items) => items.filter((item) => item.id !== last.id));
  };
  const exportPng = () => {
    const link = document.createElement('a');
    link.download = `whiteboard-${sessionId}-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return <section className={`whiteboard-stage whiteboard-stage--${layout}`} ref={stageRef}>
    <div className="whiteboard-toolbar" role="toolbar" aria-label="Whiteboard tools">
      {tools.map(([name, Icon, label]) => <button key={name} type="button" className={tool === name ? 'is-active' : ''} onClick={() => setTool(name)} title={label}><Icon size={17} /></button>)}
      <span className="whiteboard-divider" />
      {colors.map((swatch) => <button key={swatch} type="button" className={`whiteboard-swatch ${color === swatch ? 'is-active' : ''}`} style={{ background: swatch }} onClick={() => setColor(swatch)} aria-label={`Color ${swatch}`} />)}
      {widths.map((size) => <button key={size} type="button" className={`whiteboard-width ${width === size ? 'is-active' : ''}`} onClick={() => setWidth(size)} aria-label={`Thickness ${size}`}><i style={{ width: size + 4, height: size + 4 }} /></button>)}
      <button type="button" onClick={undo} title="Undo"><Undo2 size={17} /></button><button type="button" onClick={() => setRedo([])} title="Redo"><Redo2 size={17} /></button>
      {isHost && <button type="button" onClick={async () => { try { await clearWhiteboard(sessionId); setStrokes([]); } catch { setError('The board could not be cleared.'); } }} title="Clear board"><Trash2 size={17} /></button>}
    </div>
    <div className="whiteboard-stage-actions">{isHost && <label><input type="checkbox" checked={studentsCanDraw} onChange={async (event) => { const value = event.target.checked; setStudentsCanDrawState(value); try { await setStudentsCanDraw(sessionId, value); } catch { setError('Drawing permissions could not be updated.'); } }} /> Students can draw</label>}{isHost && <button type="button" onClick={exportPng}>Export PNG</button>}{isHost && <button type="button" onClick={onClose}>Close</button>}</div>
    {error && <div className="whiteboard-error" role="alert">{error}</div>}
    <canvas ref={canvasRef} onPointerDown={startDrawing} onPointerMove={continueDrawing} onPointerUp={finishDrawing} onPointerCancel={finishDrawing} />
  </section>;
}
