import { Panel } from '../../components/Panel/Panel';
//import { useUiStore } from '../../state/useUiStore'
import styles from './MoreToolsPanel.module.css';

// For now this panel is static. We will make it functional later.
export function MoreToolsPanel() {
  // const openPanel = useUiStore((state) => state.openPanel);
  // const isOpen = openPanel === 'moreTools';
  const isOpen = false; // Temporarily disabled

  const panelClassName = `${styles.moreToolsPanel} ${isOpen ? styles.open : ''}`;

  return (
    <Panel className={panelClassName}>
      <div className={styles.buttonList}>
        {/* We will build these buttons out later */}
        <p>Overwatch</p>
        <p>Zoom Presets</p>
        <p>Toggle Minimap</p>
      </div>
    </Panel>
  );
}
