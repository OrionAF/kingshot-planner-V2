// Layer registration stubs – future expansion for ordering & overlays
import { RenderLayer } from '../types/infrastructure.types';

type DrawFn = (time: number) => void;

class LayerManager {
  private layers: Map<number, Set<DrawFn>> = new Map();
  register(layer: number, fn: DrawFn) {
    if (!this.layers.has(layer)) this.layers.set(layer, new Set());
    this.layers.get(layer)!.add(fn);
    return () => this.layers.get(layer)?.delete(fn);
  }
  draw(time: number) {
    const keys = Array.from(this.layers.keys()).sort((a, b) => a - b);
    for (const k of keys) for (const fn of this.layers.get(k)!) fn(time);
  }
}

export const layerManager = new LayerManager();
export { RenderLayer };
