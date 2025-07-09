import { useUiStore } from '../../state/useUiStore'
import styles from './ModalOverlay.module.css'

export function ModalOverlay() {
  const { openPanel, closeAllPanels } = useUiStore()

  // The overlay is only visible if a panel is open.
  const isVisible = openPanel !== null
  const overlayClassName = `${styles.overlay} ${isVisible ? styles.visible : ''}`

  // A simple safety check to prevent accidental closure.
  const handleClick = () => {
    if (isVisible) {
      closeAllPanels()
    }
  }

  return <div className={overlayClassName} onClick={handleClick} />
}
