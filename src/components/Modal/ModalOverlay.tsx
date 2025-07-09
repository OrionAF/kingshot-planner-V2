// src/components/Modal/ModalOverlay.tsx

import React from 'react'
import { createPortal } from 'react-dom'
import styles from './ModalOverlay.module.css'

interface ModalOverlayProps {
  children: React.ReactNode
  onClose?: () => void
}

export function ModalOverlay({ children, onClose }: ModalOverlayProps) {
  // Event handler for clicking the dark background
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // We check if the click target is the overlay itself, not its children.
    // This prevents the modal from closing when you click inside the panel.
    if (e.target === e.currentTarget && onClose) {
      onClose()
    }
  }

  // Use createPortal to render the modal JSX directly into the document's body.
  // This ensures it renders on top of all other content.
  return createPortal(
    <div
      className={`${styles.overlay} ${styles.visible}`}
      onClick={handleOverlayClick}
    >
      {children}
    </div>,
    document.body // The destination container for our portal
  )
}
