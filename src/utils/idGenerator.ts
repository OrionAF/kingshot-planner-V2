let nextId = 1;

export function generateId(): number {
  return nextId++;
}

export function seedIdCounter(minNextId: number): void {
  if (Number.isFinite(minNextId) && minNextId > nextId) {
    nextId = Math.floor(minNextId);
  }
}
