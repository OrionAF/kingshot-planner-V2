// src/features/Navigation/MinimapPanel.tsx
import { useEffect, useRef, useMemo, useCallback } from 'react';
import { Panel } from '../../components/Panel/Panel';
import { useUiStore } from '../../state/useUiStore';
import { useCameraStore } from '../../state/useCameraStore';
import { useMapStore } from '../../state/useMapStore';
import { AppConfig } from '../../config/appConfig';
import styles from './MinimapPanel.module.css';
import { worldToScreen, screenToWorld } from '../../core/coordinate-utils';

// Optimized minimap:
// - Static layer (biomes, territory, bases) drawn only when its data changes.
// - Dynamic overlay (viewport diamond) drawn only on camera changes.
// - True isometric diamond shape via clipping the screen-projected map corners.
export function MinimapPanel() {
  const openPanel = useUiStore((s) => s.openPanel);
  const isOpen = openPanel === 'minimap';
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Primitive camera selectors to avoid object identity churn.
  const camX = useCameraStore((s) => s.x);
  const camY = useCameraStore((s) => s.y);
  const camScale = useCameraStore((s) => s.scale);
  const focusOn = useCameraStore((s) => s.focusOn);

  // Map data
  const baseBuildings = useMapStore((s) => s.baseBuildings);
  const alliances = useMapStore((s) => s.alliances);
  const territory = useMapStore((s) => s.claimedTerritory);
  const userBuildings = useMapStore((s) => s.userBuildings);
  const baseSnapshot = useMemo(() => baseBuildings, [baseBuildings]);
  const userSnapshot = useMemo(() => userBuildings, [userBuildings]);

  // Dimensions in isometric screen space (unscaled)
  const fullWidth = AppConfig.N * AppConfig.tileW; // horizontal span of diamond
  const fullHeight = AppConfig.N * AppConfig.tileH; // vertical magnitude (positive value)
  const targetWidth = 240; // choose a consistent logical size inside panel
  const scale = targetWidth / fullWidth;
  const canvasW = targetWidth;
  const canvasH = Math.round(fullHeight * scale);
  const halfWidth = fullWidth / 2;

  // Build static layer: clipped diamond + gradient + territory + bases + user buildings
  useEffect(() => {
    if (!isOpen) return;
    const canvas = baseCanvasRef.current;
    if (!canvas) return;
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasW, canvasH);

    // Compute diamond corner screen coords (unscaled) then map to minimap space.
    const c0 = worldToScreen(0, 0);
    const c1 = worldToScreen(AppConfig.N, 0);
    const c2 = worldToScreen(AppConfig.N, AppConfig.N);
    const c3 = worldToScreen(0, AppConfig.N);
    const mapPt = ([sx, sy]: [number, number]) => [
      (sx + halfWidth) * scale,
      (sy + fullHeight) * scale,
    ];
    const d0 = mapPt(c0),
      d1 = mapPt(c1),
      d2 = mapPt(c2),
      d3 = mapPt(c3);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(d0[0], d0[1]);
    ctx.lineTo(d1[0], d1[1]);
    ctx.lineTo(d2[0], d2[1]);
    ctx.lineTo(d3[0], d3[1]);
    ctx.closePath();
    ctx.clip();

    // Biome raster with 2x supersampling to eliminate visible tile grid aliasing
    const SS = 2; // supersample factor
    const oW = canvasW * SS;
    const oH = canvasH * SS;
    const off = document.createElement('canvas');
    off.width = oW;
    off.height = oH;
    const octx = off.getContext('2d');
    if (octx) {
      const imgData = octx.createImageData(oW, oH);
      const data = imgData.data;
      const fertileR = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(
        AppConfig.biomeColors.fertile,
      )!;
      const plainsR = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(
        AppConfig.biomeColors.plains,
      )!;
      const badlandsR = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(
        AppConfig.biomeColors.badlands,
      )!;
      const fertileCol: [number, number, number] = [
        parseInt(fertileR[1]),
        parseInt(fertileR[2]),
        parseInt(fertileR[3]),
      ];
      const plainsCol: [number, number, number] = [
        parseInt(plainsR[1]),
        parseInt(plainsR[2]),
        parseInt(plainsR[3]),
      ];
      const badlandsCol: [number, number, number] = [
        parseInt(badlandsR[1]),
        parseInt(badlandsR[2]),
        parseInt(badlandsR[3]),
      ];
      const { fertile, plains } = AppConfig.biomeRegions;
      const tw2 = AppConfig.tileW / 2;
      const th2 = AppConfig.tileH / 2;
      for (let py = 0; py < oH; py++) {
        for (let px = 0; px < oW; px++) {
          const sx = px / SS / scale - halfWidth;
          const sy = py / SS / scale - fullHeight;
          const u = sx / tw2; // x - y
          const v = -sy / th2; // x + y
          const wx = (u + v) / 2;
          const wy = (v - u) / 2;
          let col: [number, number, number];
          if (
            wx >= fertile.x1 &&
            wx <= fertile.x2 &&
            wy >= fertile.y1 &&
            wy <= fertile.y2
          )
            col = fertileCol;
          else if (
            wx >= plains.x1 &&
            wx <= plains.x2 &&
            wy >= plains.y1 &&
            wy <= plains.y2
          )
            col = plainsCol;
          else col = badlandsCol;
          const idx = (py * oW + px) * 4;
          data[idx] = col[0];
          data[idx + 1] = col[1];
          data[idx + 2] = col[2];
          data[idx + 3] = 255;
        }
      }
      octx.putImageData(imgData, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, 0, 0, canvasW, canvasH);
    }

    // Territory: overlay semi-transparent tint (decimated)
    territory.forEach((tiles, allianceId) => {
      const alliance = alliances.find((a) => a.id === allianceId);
      if (!alliance) return;
      const fill = alliance.color || '#888';
      ctx.fillStyle = fill + '55';
      let i = 0;
      tiles.forEach((t) => {
        if (i++ % 5 !== 0) return; // adjustable sampling rate
        const [tx, ty] = t.split(',').map(Number);
        const [sx, sy] = worldToScreen(tx, ty);
        const dx = (sx + halfWidth) * scale;
        const dy = (sy + fullHeight) * scale;
        ctx.fillRect(dx, dy, 1, 1);
      });
    });

    // Base buildings (use intrinsic color if available)
    for (const b of baseSnapshot) {
      const [sx, sy] = worldToScreen(b.x, b.y);
      const dx = (sx + halfWidth) * scale;
      const dy = (sy + fullHeight) * scale;
      if (b.color && b.color !== 'transparent') {
        ctx.fillStyle = b.color;
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
      }
      ctx.fillRect(dx, dy, 2, 2);
    }

    // User buildings (alliance-colored, slightly larger for visibility)
    for (const ub of userSnapshot) {
      const [sx, sy] = worldToScreen(ub.x, ub.y);
      const dx = (sx + halfWidth) * scale;
      const dy = (sy + fullHeight) * scale;
      ctx.fillStyle = ub.color || '#ffffff';
      ctx.fillRect(dx - 1, dy - 1, 3, 3); // 3x3 pixel square centered-ish
    }

    ctx.restore();
    // Diamond outline
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(d0[0], d0[1]);
    ctx.lineTo(d1[0], d1[1]);
    ctx.lineTo(d2[0], d2[1]);
    ctx.lineTo(d3[0], d3[1]);
    ctx.closePath();
    ctx.stroke();
  }, [
    isOpen,
    baseSnapshot,
    userSnapshot,
    alliances,
    territory,
    canvasW,
    canvasH,
    halfWidth,
    scale,
    fullHeight,
  ]);

  // Dynamic overlay: viewport diamond (fast) on camera changes only
  useEffect(() => {
    if (!isOpen) return;
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasW, canvasH);
    if (typeof window === 'undefined') return;

    const cameraObj = { x: camX, y: camY, scale: camScale } as any;
    const cornerScr: [number, number][] = [
      [0, 0],
      [window.innerWidth, 0],
      [window.innerWidth, window.innerHeight],
      [0, window.innerHeight],
    ];
    const worldCorners = cornerScr.map(([sx, sy]) =>
      screenToWorld(sx, sy, cameraObj),
    );
    const poly = worldCorners.map(([wx, wy]) => {
      const [psx, psy] = worldToScreen(wx, wy);
      return [(psx + halfWidth) * scale, (psy + fullHeight) * scale] as [
        number,
        number,
      ];
    });
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.moveTo(poly[0][0], poly[0][1]);
    for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [
    isOpen,
    camX,
    camY,
    camScale,
    canvasW,
    canvasH,
    halfWidth,
    scale,
    fullHeight,
  ]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = baseCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      // Convert minimap pixel back to world tile via inverse of transformations.
      const sx = mx / scale - halfWidth; // back to unshifted screen space
      const sy = my / scale - fullHeight;
      // Invert worldToScreen: sx = (x - y)*tw/2, sy = -(x + y)*th/2
      const tw2 = AppConfig.tileW / 2;
      const th2 = AppConfig.tileH / 2;
      const u = sx / tw2; // x - y
      const v = -sy / th2; // x + y
      const wx = (u + v) / 2;
      const wy = (v - u) / 2;
      if (wx >= 0 && wy >= 0 && wx <= AppConfig.N && wy <= AppConfig.N) {
        focusOn(Math.round(wx), Math.round(wy));
      }
    },
    [focusOn, scale, halfWidth, fullHeight],
  );

  if (!isOpen) return null;

  return (
    <Panel className={styles.minimapPanel}>
      <div style={{ fontWeight: 600 }}>Minimap</div>
      <div className={styles.canvasWrap} style={{ height: canvasH }}>
        <canvas
          ref={baseCanvasRef}
          width={canvasW}
          height={canvasH}
          onClick={handleClick}
        />
        <canvas
          ref={overlayCanvasRef}
          width={canvasW}
          height={canvasH}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            pointerEvents: 'none',
          }}
        />
      </div>
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.swatch} style={{ background: '#fff' }} /> Base
          Map
        </div>
        <div className={styles.legendItem}>
          <span className={styles.swatch} style={{ background: '#888' }} />{' '}
          Territory (tinted)
        </div>
        <div className={styles.legendItem}>
          <span
            className={styles.swatch}
            style={{
              background: 'rgba(255,255,255,0.18)',
              border: '1px solid #fff',
            }}
          />{' '}
          View
        </div>
        <div className={styles.legendItem}>
          <span
            className={styles.swatch}
            style={{ background: 'linear-gradient(45deg,#f00,#0f0)' }}
          />{' '}
          Alliances
        </div>
      </div>
      <div style={{ fontSize: 10, opacity: 0.7 }}>
        Future: players, zoom drag.
      </div>
    </Panel>
  );
}
