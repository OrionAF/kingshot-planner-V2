import { type ReactNode, type MouseEvent } from 'react';
import styles from './Panel.module.css';

interface PanelProps {
  children: ReactNode;
  className?: string;
}

export function Panel({ children, className }: PanelProps) {
  const combinedClassName = `${styles.panel} ${className || ''}`;

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className={combinedClassName} onClick={handleClick}>
      {children}
    </div>
  );
}
