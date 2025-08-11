import { Panel } from '../../components/Panel/Panel';
import { useUiStore } from '../../state/useUiStore';
import { useBookmarkStore } from '../../state/useBookmarkStore';
import { useCameraStore } from '../../state/useCameraStore';
import { useSelectionStore } from '../../state/useSelectionStore';
import { useMapStore } from '../../state/useMapStore';
import { useEffect, useState } from 'react';

export function BookmarkPanel() {
  const openPanel = useUiStore((s) => s.openPanel);
  const { bookmarks, addBookmark, renameBookmark, reorder } =
    useBookmarkStore();
  const selection = useSelectionStore((s) => s.selection);
  // Derive selected target (tile OR building OR player)
  let selectedCoords: { x: number; y: number } | null = null;
  let selectedDefaultLabel = '';
  if (selection) {
    if (selection.type === 'tile') {
      selectedCoords = selection.data;
      selectedDefaultLabel = `${selection.data.x},${selection.data.y}`;
    } else if (selection.type === 'userBuilding') {
      selectedCoords = { x: selection.data.x, y: selection.data.y };
      // Include alliance tag if available
      const { alliances } = useMapStore.getState();
      const alliance = alliances.find(
        (a) => a.id === selection.data.allianceId,
      );
      selectedDefaultLabel = alliance
        ? `${alliance.tag}_${selection.data.type}`
        : selection.data.type;
    } else if (selection.type === 'baseBuilding') {
      selectedCoords = { x: selection.data.x, y: selection.data.y };
      selectedDefaultLabel = selection.data.dpName || 'Base';
    } else if (selection.type === 'player') {
      selectedCoords = { x: selection.data.x, y: selection.data.y };
      selectedDefaultLabel = selection.data.name || 'Player';
    }
  }
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

  // Sort within pinned/unpinned groups by order
  const pinned = bookmarks
    .filter((b) => b.pinned)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const unpinned = bookmarks
    .filter((b) => !b.pinned)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // Track globally which bookmark is being dragged
  const [draggingId, setDraggingId] = useState<string | null>(null);

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
                selectedCoords
                  ? `Add bookmark at (${selectedCoords.x},${selectedCoords.y})`
                  : 'Select a tile / building / player to add a bookmark'
              }
              disabled={!selectedCoords}
              onClick={() => {
                if (!selectedCoords) return;
                const raw = prompt('Label for bookmark?', selectedDefaultLabel);
                if (raw === null) return; // user cancelled
                const label = raw.trim();
                if (!label) return; // ignore empty
                addBookmark(
                  Math.round(selectedCoords.x),
                  Math.round(selectedCoords.y),
                  label,
                );
              }}
            >
              +Bookmark
            </button>
          </div>
        </div>
        <div
          style={{
            fontSize: 12,
            lineHeight: 1.3,
            opacity: 0.85,
            marginBottom: 10,
            color: '#e1e6eb',
          }}
        >
          Select a tile, building, or player; then add. Drag rows to reorder.
          Double‑click label to rename.
        </div>
        {bookmarks.length === 0 && (
          <div style={{ opacity: 0.6, fontSize: 12 }}>No bookmarks.</div>
        )}
        {bookmarks.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              maxHeight: 400,
              overflowY: 'auto',
            }}
          >
            {pinned.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <SectionHeader label="Pinned" />
                {pinned.map((b) => (
                  <BookmarkRow
                    key={b.id}
                    b={b}
                    rename={renameBookmark}
                    reorder={reorder}
                    draggingId={draggingId}
                    setDraggingId={setDraggingId}
                  />
                ))}
              </div>
            )}
            {unpinned.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pinned.length > 0 && <SectionHeader label="Others" subtle />}
                {unpinned.map((b) => (
                  <BookmarkRow
                    key={b.id}
                    b={b}
                    rename={renameBookmark}
                    reorder={reorder}
                    draggingId={draggingId}
                    setDraggingId={setDraggingId}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}

const miniBtn: React.CSSProperties = {
  background: 'linear-gradient(#394249,#31393f)',
  border: '1px solid #4d5860',
  padding: '3px 8px',
  fontSize: 11,
  cursor: 'pointer',
  borderRadius: 4,
  color: '#f5f9fc',
  fontWeight: 500,
};

function BookmarkRow({ b, rename, reorder, draggingId, setDraggingId }: any) {
  const { togglePinned, removeBookmark } = useBookmarkStore.getState();
  const focusOn = useCameraStore.getState().focusOn;
  const camera = useCameraStore.getState();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(b.label || '');
  const dragging = draggingId === b.id;
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', b.id);
        setDraggingId(b.id);
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        if (draggingId !== b.id) setDragOver(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragOver(false);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const sourceId = draggingId || e.dataTransfer.getData('text/plain');
        if (sourceId && sourceId !== b.id) reorder(sourceId, b.id);
        setDragOver(false);
        setDraggingId(null);
      }}
      onDragEnd={() => {
        setDragOver(false);
        setDraggingId(null);
      }}
      style={{
        background: dragOver
          ? 'rgba(255,255,255,0.18)'
          : 'rgba(255,255,255,0.08)',
        padding: '8px 10px',
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        border: dragging
          ? '1px dashed #5fa3ff'
          : '1px solid rgba(255,255,255,0.08)',
        opacity: dragging ? 0.5 : 1,
        cursor: 'grab',
        fontSize: 14,
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
              style={{
                cursor: 'pointer',
                fontWeight: 600,
                color: '#f4f8fb',
                letterSpacing: 0.3,
              }}
              title={`Go to (${b.x},${b.y}) (double‑click to rename)`}
            >
              {b.label || `${b.x},${b.y}`}
            </span>
          )}
          <span
            style={{
              fontSize: 12,
              opacity: 0.75,
              color: '#d0d8de',
              fontFamily: 'monospace',
            }}
          >
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
            style={{
              ...miniBtn,
              color: '#ffd3d3',
              background: 'linear-gradient(#603030,#4b1f1f)',
              border: '1px solid #7a4242',
            }}
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

function SectionHeader({ label, subtle }: { label: string; subtle?: boolean }) {
  return (
    <div
      style={{
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: 600,
        color: subtle ? '#9aa3ab' : '#cfd6dd',
        opacity: subtle ? 0.8 : 1,
        padding: '0 2px',
      }}
    >
      {label}
    </div>
  );
}
