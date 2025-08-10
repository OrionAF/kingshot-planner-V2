// src/components/Modal/ModalOverlay.tsx

import React from 'react';
import { createPortal } from 'react-dom';
import styles from './ModalOverlay.module.css';

interface ModalOverlayProps {
  children: React.ReactNode;
  onClose?: () => void;
}

export function ModalOverlay({ children, onClose }: ModalOverlayProps) {
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  return createPortal(
    <div
      className={`${styles.overlay} ${styles.visible}`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>,
    document.body,
  );
}
