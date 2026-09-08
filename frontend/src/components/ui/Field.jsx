import React from 'react';
import { ChevronDown } from 'lucide-react';
import './ui.css';

export function Field({ label, help, error, children }) {
  return <label className={`ui-field${error ? ' ui-field--error' : ''}`}><span>{label}</span>{children}{help && !error && <small>{help}</small>}{error && <small>{error}</small>}</label>;
}

export function Input(props) {
  return <input className="ui-input" {...props} />;
}

export function Textarea(props) {
  return <textarea className="ui-input ui-textarea" {...props} />;
}

export function Select({ children, ...props }) {
  return <span className="ui-select"><select className="ui-input" {...props}>{children}</select><ChevronDown size={16} aria-hidden="true" /></span>;
}
