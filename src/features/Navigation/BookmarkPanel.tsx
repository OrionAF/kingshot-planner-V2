import { Panel } from '../../components/Panel/Panel';
import { useUiStore } from '../../state/useUiStore';
import { useBookmarkStore } from '../../state/useBookmarkStore';
import { useCameraStore } from '../../state/useCameraStore';
import { useSelectionStore } from '../../state/useSelectionStore';
import { useEffect, useState } from 'react';

export function BookmarkPanel() {
  const openPanel = useUiStore((s) => s.openPanel);
  const { bookmarks, addBookmark, renameBookmark, reorder } =
    useBookmarkStore();
  const selection = useSelectionStore((s) => s.selection);
  const selectedTile =
    selection && selection.type === 'tile' ? selection.data : null;
  const isOpen = openPanel === 'bookmarks';

  // anchor above toolbar button
  const [anchor, setAnchor] = useState<{ left: number; bottom: number } | null>(
    null,
  );
  useEffect(() => {
    if (!isOpen) return;
    const btn = document.querySelector(
      'button[title="Bookmarks"]:not(.mobileOnly)',
    ) as HTMLElement | null;
    if (btn) {
      const r = btn.getBoundingClientRect();
      setAnchor({ left: r.left + r.width / 2, bottom: r.top });
    }
  }, [isOpen]);

  const sorted = bookmarks
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div
      style={{
        position: 'fixed',
        left: anchor ? anchor.left - 160 : 340,
        bottom: anchor ? window.innerHeight - anchor.bottom + 60 : 120,
        width: 320,
        zIndex: 1001,
        pointerEvents: isOpen ? 'auto' : 'none',
        opacity: isOpen ? 1 : 0,
        transition: 'opacity .18s',
      }}
    >
      <Panel className={isOpen ? 'open' : ''}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 6,
          }}
        >
          <h4
            style={{
              margin: 0,
              fontSize: 13,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              color: '#d0d5dc',
            }}
          >
            Bookmarks
          </h4>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              style={miniBtn}
              title={
                selectedTile
                  ? `Add bookmark at selected tile (${selectedTile.x},${selectedTile.y})`
                  : 'Select a tile to add a bookmark'
              }
              disabled={!selectedTile}
              onClick={() => {
                if (!selectedTile) return;
                const label = prompt('Label for bookmark?', '') || '';
                addBookmark(
                  Math.round(selectedTile.x),
                  Math.round(selectedTile.y),
                  label.trim(),
                );
              }}
            >
              +Bookmark
            </button>
          </div>
        </div>
        <div
          style={{
            fontSize: 11,
            lineHeight: 1.3,
            opacity: 0.7,
            marginBottom: 8,
            color: '#c2c8d0',
          }}
        >
          Select a tile then add. Drag to reorder. Double‑click label to rename.
        </div>
        {bookmarks.length === 0 && (
          <div style={{ opacity: 0.6, fontSize: 12 }}>No bookmarks.</div>
        )}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            maxHeight: 360,
            overflowY: 'auto',
          }}
        >
          {sorted.map((b) => (
            <BookmarkRow
              key={b.id}
              b={b}
              rename={renameBookmark}
              reorder={reorder}
            />
          ))}
        </div>
      </Panel>
    </div>
  );
}

const miniBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid #333',
  padding: '2px 6px',
  fontSize: 10,
  cursor: 'pointer',
  borderRadius: 3,
};

function BookmarkRow({ b, rename, reorder }: any) {
  const { togglePinned, removeBookmark } = useBookmarkStore.getState();
  const focusOn = useCameraStore.getState().focusOn;
  const camera = useCameraStore.getState();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(b.label || '');
  const [dragging, setDragging] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        setDragging(true);
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        if (!dragging) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        setDragging(false);
        // id of dragged item is stored via dataTransfer OR fallback to global selection (here simplify: use label in data)
        const draggedId = e.dataTransfer.getData('text/plain');
        if (draggedId && draggedId !== b.id) reorder(draggedId, b.id);
      }}
      onDragEnd={(e) => {
        const draggedId = e.dataTransfer.getData('text/plain');
        if (draggedId && draggedId !== b.id && !dragOver)
          reorder(draggedId, null);
        setDragging(false);
        setDragOver(false);
      }}
      onMouseDown={(e) => {
        const handler = (ds: Event) => {
          const de = ds as DragEvent;
          de.dataTransfer?.setData('text/plain', b.id);
        };
        e.currentTarget.addEventListener('dragstart', handler, { once: true });
      }}
      style={{
        background: dragOver
          ? 'rgba(255,255,255,0.15)'
          : 'rgba(255,255,255,0.06)',
        padding: '6px 8px',
        borderRadius: 6,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        border: dragging
          ? '1px dashed #5fa3ff'
          : '1px solid rgba(255,255,255,0.08)',
        opacity: dragging ? 0.5 : 1,
        cursor: 'grab',
        fontSize: 13,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          {editing ? (
            <input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={() => {
                setEditing(false);
                if (value.trim() !== (b.label || '')) {
                  rename(b.id, value.trim());
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                if (e.key === 'Escape') {
                  setValue(b.label || '');
                  setEditing(false);
                }
              }}
              style={{
                background: '#1e2226',
                border: '1px solid #2f353b',
                padding: '2px 4px',
                borderRadius: 4,
                color: '#e6ebef',
                fontSize: 13,
              }}
            />
          ) : (
            <span
              onDoubleClick={() => setEditing(true)}
              onClick={() => focusOn(b.x, b.y, { scale: camera.scale })}
              style={{ cursor: 'pointer', fontWeight: 500, color: '#eef2f5' }}
              title={`Go to (${b.x},${b.y}) (double‑click to rename)`}
            >
              {b.label || `${b.x},${b.y}`}
            </span>
          )}
          <span style={{ fontSize: 10, opacity: 0.55, color: '#b4bcc4' }}>
            @ {b.x},{b.y}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            style={miniBtn}
            title="Center camera"
            onClick={() => focusOn(b.x, b.y, { scale: camera.scale })}
          >
            Go
          </button>
          <button
            style={miniBtn}
            title={b.pinned ? 'Unpin bookmark' : 'Pin bookmark'}
            onClick={() => togglePinned(b.id)}
          >
            {b.pinned ? '★' : '☆'}
          </button>
          <button
            style={{ ...miniBtn, color: '#ff9d9d' }}
            title="Delete bookmark"
            onClick={() => {
              if (!confirm('Delete bookmark?')) return;
              removeBookmark(b.id);
            }}
          >
            Del
          </button>
        </div>
      </div>
    </div>
  );
}
