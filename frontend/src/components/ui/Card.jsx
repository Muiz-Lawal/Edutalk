import React from 'react';
import './ui.css';

export default function Card({ title, subtitle, actions, children, className = '' }) {
  return (
    <section className={`ui-card ${className}`}>
      {(title || subtitle || actions) && (
        <header className="ui-card__header">
          <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
          {actions && <div className="ui-card__actions">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
