import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';
import './ui.css';

export default function EmptyState({ title, description, action, icon: Icon = Inbox }) {
  return (
    <div className="ui-empty-state">
      <Icon size={40} strokeWidth={2} aria-hidden="true" />
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {action && <Button variant={action.variant || 'primary'} onClick={action.onClick}>{action.label}</Button>}
    </div>
  );
}
