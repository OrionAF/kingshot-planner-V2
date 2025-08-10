import { useEffect, useState } from 'react';
import { getAllianceStats } from '../state/selectors';
import { globalEventBus } from '../types/infrastructure.types';

export function useAllianceStats() {
  const [stats, setStats] = useState(() => getAllianceStats());
  useEffect(() => {
    const update = () => setStats(getAllianceStats());
    const off1 = globalEventBus.on('territory:recalculated', update);
    const off2 = globalEventBus.on('alliances:changed', update);
    update();
    return () => {
      off1();
      off2();
    };
  }, []);
  return stats;
}
