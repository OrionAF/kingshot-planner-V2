import { type ReactNode } from 'react'
import styles from './Panel.module.css'

// Define the component's properties (props).
interface PanelProps {
  // 'children' is a special prop in React. It refers to whatever
  // components or HTML are nested inside our <Panel> tag.
  // `ReactNode` is a type that means "anything React can render".
  children: ReactNode

  // We'll also accept an optional `className` so we can add extra
  // styles to specific panels later (e.g., for positioning).
  className?: string
}

export function Panel({ children, className }: PanelProps) {
  // We combine our base 'panel' style with any extra className that was passed in.
  const combinedClassName = `${styles.panel} ${className || ''}`

  return <div className={combinedClassName}>{children}</div>
}
