import * as React from 'react';

declare const Card: React.ComponentType<{
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}>;

export default Card;
