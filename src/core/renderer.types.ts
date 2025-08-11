// Renderer interface & related types (Phase 0 completion)
export interface Renderer {
  renderFrame(time: number): void;
  dispose(): void;
}
