import { type ReactNode, type MouseEvent } from 'react'
import styles from './Panel.module.css'

interface PanelProps {
  children: ReactNode
  className?: string
}

export function Panel({ children, className }: PanelProps) {
  const combinedClassName = `${styles.panel} ${className || ''}`

  // This is the new click handler.
  const handleClick = (e: MouseEvent) => {
    // This is the key: it stops the click event from bubbling up
    // to the ModalOverlay behind this panel.
    e.stopPropagation()
  }

  return (
    <div className={combinedClassName} onClick={handleClick}>
      {children}
    </div>
  )
}
