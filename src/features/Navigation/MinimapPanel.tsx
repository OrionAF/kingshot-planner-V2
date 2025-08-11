// src/features/Navigation/MinimapPanel.tsx
import { useEffect, useRef, useMemo, useCallback, useState } from 'react';
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
  const isOpen = useUiStore((s) => s.minimapVisible);
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
  const players = useMapStore((s) => s.players);
  const baseSnapshot = useMemo(() => baseBuildings, [baseBuildings]);
  const userSnapshot = useMemo(() => userBuildings, [userBuildings]);
  const minimapLayers = useUiStore((s) => s.minimapLayers);
  const setLayer = useUiStore((s) => s.setMinimapLayer);

  // Dimensions in isometric screen space (unscaled)
  const fullWidth = AppConfig.N * AppConfig.tileW; // horizontal span of diamond
  const fullHeight = AppConfig.N * AppConfig.tileH; // vertical magnitude (positive value)
  // Dynamic sizing using simple auto/fixed layout
  const layoutCfg = AppConfig.minimap.layout;
  const computeCanvasSize = () => {
    if (layoutCfg.mode === 'auto' && typeof window !== 'undefined') {
      const div = layoutCfg.autoDivisor || 5;
      const w = Math.round(window.innerWidth / div);
      const h = Math.round(window.innerHeight / div);
      return { w, h };
    }
    // fixed: width from logicalTargetWidth, height from world aspect
    const w = AppConfig.minimap.logicalTargetWidth;
    const s = w / fullWidth;
    const h = Math.round(fullHeight * s);
    return { w, h };
  };
  const [canvasSize, setCanvasSize] = useState(() => computeCanvasSize());
  useEffect(() => {
    if (layoutCfg.mode !== 'auto') return;
    const onResize = () => setCanvasSize(computeCanvasSize());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [layoutCfg.mode, layoutCfg.autoDivisor]);
  const canvasW = canvasSize.w;
  const canvasH = canvasSize.h;
  // Fit world into canvas preserving isometric aspect by choosing min scale
  const baseScale = Math.min(canvasW / fullWidth, canvasH / fullHeight);
  const halfWidth = fullWidth / 2;
  const miniTransformRef = useRef({ scale: baseScale, shiftX: 0, shiftY: 0 });

  // Persist layer settings (basic)
  useEffect(() => {
    try {
      localStorage.setItem(
        'kingshot-minimapLayers-v1',
        JSON.stringify(minimapLayers),
      );
    } catch {}
  }, [minimapLayers]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('kingshot-minimapLayers-v1');
      if (raw) {
        const saved = JSON.parse(raw);
        for (const k in saved) {
          if (k in minimapLayers) setLayer(k as any, saved[k]);
        }
      }
    } catch {}
    // run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build static layer: clipped diamond + gradient + territory + bases + user buildings + players (dynamic zoom)
  useEffect(() => {
    if (!isOpen) return;
    const canvas = baseCanvasRef.current;
    if (!canvas) return;
    // Render at higher internal resolution for sharpness if pixelDensity > 1
    const dpr = layoutCfg.pixelDensity || 1;
    canvas.width = Math.round(canvasW * dpr);
    canvas.height = Math.round(canvasH * dpr);
    canvas.style.width = canvasW + 'px';
    canvas.style.height = canvasH + 'px';
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvasW, canvasH);
    // Minimap zooms from full world (baseScale) to percent of world (baseScale/percent) as main map zooms in
    const minCam = AppConfig.camera.minScale;
    const maxCam = AppConfig.camera.maxScale;
    // Resolve target fraction of world visible at max main-map zoom.
    // Accept values in [0,1] (fraction) or (1,100] (percentage).
    // When fractionMode === 'area', the provided value represents area coverage; convert to linear fraction via sqrt.
    let targetFraction = AppConfig.minimap.maxWorldFractionAtMaxZoom;
    if (targetFraction > 1) targetFraction = targetFraction / 100; // treat as percent
    targetFraction = Math.max(0.01, Math.min(1, targetFraction));
    if (AppConfig.minimap.fractionMode === 'area') {
      targetFraction = Math.sqrt(targetFraction);
    }
    let t = Math.max(0, Math.min(1, (camScale - minCam) / (maxCam - minCam)));
    // Apply easing curve selectable via config
    const easing = AppConfig.minimap.easing;
    switch (easing.mode) {
      case 'easeOutQuad':
        t = 1 - (1 - t) * (1 - t);
        break;
      case 'easeInOutCubic':
        t = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        break;
      case 'log':
        // Map linear t -> logarithmic progression accentuating low-end zoom differences
        // Avoid log(0); shift domain.
        const base = easing.logBase || 5;
        t = Math.log(t * (base - 1) + 1) / Math.log(base);
        break;
      case 'power':
        t = Math.pow(t, easing.exponent || 1.5);
        break;
      case 'linear':
      default:
        break;
    }
    const maxScale = baseScale / targetFraction;
    const dynamicScale = baseScale * (1 - t) + maxScale * t;
    let centerWorldX = 0,
      centerWorldY = 0;
    if (typeof window !== 'undefined') {
      [centerWorldX, centerWorldY] = screenToWorld(
        window.innerWidth / 2,
        window.innerHeight / 2,
        { x: camX, y: camY, scale: camScale } as any,
      );
    }
    const [centerSX, centerSY] = worldToScreen(centerWorldX, centerWorldY);
    const shiftX = canvasW / 2 - (centerSX + halfWidth) * dynamicScale;
    const shiftY = canvasH / 2 - (centerSY + fullHeight) * dynamicScale;
    miniTransformRef.current = { scale: dynamicScale, shiftX, shiftY };

    const c0 = worldToScreen(0, 0);
    const c1 = worldToScreen(AppConfig.N, 0);
    const c2 = worldToScreen(AppConfig.N, AppConfig.N);
    const c3 = worldToScreen(0, AppConfig.N);
    const mapPt = ([sx, sy]: [number, number]) => [
      (sx + halfWidth) * dynamicScale + shiftX,
      (sy + fullHeight) * dynamicScale + shiftY,
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
    const SS = AppConfig.minimap.supersample; // supersample factor from config
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
          const sx = (px / SS - shiftX) / dynamicScale - halfWidth;
          const sy = (py / SS - shiftY) / dynamicScale - fullHeight;
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

    if (minimapLayers.alliancesGroup && minimapLayers.allianceTerritory) {
      territory.forEach((tiles, allianceId) => {
        const alliance = alliances.find((a) => a.id === allianceId);
        if (!alliance) return;
        if (!minimapLayers.alliancesGroup) return; // hide tint if alliances master disabled
        const fill = alliance.color || '#888';
        ctx.fillStyle = fill + '55';
        let i = 0;
        tiles.forEach((t) => {
          if (i++ % 5 !== 0) return; // adjustable sampling rate
          const [tx, ty] = t.split(',').map(Number);
          const [sx, sy] = worldToScreen(tx, ty);
          const dx = (sx + halfWidth) * dynamicScale + shiftX;
          const dy = (sy + fullHeight) * dynamicScale + shiftY;
          ctx.fillRect(dx, dy, 1, 1);
        });
      });
    }

    if (minimapLayers.mapBuildingsGroup) {
      for (const b of baseSnapshot) {
        const [sx, sy] = worldToScreen(b.x, b.y);
        const dx = (sx + halfWidth) * dynamicScale + shiftX;
        const dy = (sy + fullHeight) * dynamicScale + shiftY;
        ctx.fillStyle =
          b.color && b.color !== 'transparent'
            ? b.color
            : 'rgba(255,255,255,0.6)';
        const proto = b.proto || '';
        const id = b.id || '';
        const lower = proto.toLowerCase();
        const isKing =
          lower.includes('kings_castle') ||
          b.dpName.toLowerCase().includes('king');
        const isFortress = lower === 'fortress' || id.startsWith('fortress_');
        const isSanctuary =
          lower === 'sanctuary' || id.startsWith('sanctuary_');
        const isResource = ['wood', 'stone', 'iron', 'food'].includes(lower);
        const outpostSet = new Set([
          'lv1_builder',
          'lv3_builder',
          'lv1_scholar',
          'lv3_scholar',
          'lv1_forager',
          'lv1_harvest',
          'lv2_armory',
          'lv4_armory',
          'lv2_arsenal',
          'lv4_arsenal',
          'lv2_drillCamp'.toLowerCase(),
          'lv3_frontierLodge'.toLowerCase(),
        ]);
        const isOutpostLike = outpostSet.has(lower);
        // Map Building group-level toggles
        if (!minimapLayers.kingCastle && isKing) continue;
        if (isFortress) {
          if (!minimapLayers.fortresses) continue;
          // individual fortress id pattern fortress_X
          const idMatch = /fortress_(\d+)/.exec(b.id || '');
          if (idMatch) {
            const key = `fortress_${idMatch[1]}` as keyof typeof minimapLayers;
            if (key in minimapLayers && !minimapLayers[key]) continue;
          }
        }
        if (isSanctuary) {
          if (!minimapLayers.sanctuaries) continue;
          const idMatch = /sanctuary_(\d+)/.exec(b.id || '');
          if (idMatch) {
            const key = `sanctuary_${idMatch[1]}` as keyof typeof minimapLayers;
            if (key in minimapLayers && !minimapLayers[key]) continue;
          }
        }
        if (isResource) {
          if (!minimapLayers.resourcesGroup) continue;
          if (lower === 'food' && !minimapLayers.rss_food) continue;
          if (lower === 'wood' && !minimapLayers.rss_wood) continue;
          if (lower === 'stone' && !minimapLayers.rss_stone) continue;
          if (lower === 'iron' && !minimapLayers.rss_iron) continue;
        }
        if (isOutpostLike) {
          if (!minimapLayers.outposts) continue; // master outposts visibility
          // match level prototypes
          const protoKeys: (keyof typeof minimapLayers)[] = [
            'lv1_builder',
            'lv3_builder',
            'lv1_scholar',
            'lv3_scholar',
            'lv1_forager',
            'lv1_harvest',
            'lv2_armory',
            'lv4_armory',
            'lv2_arsenal',
            'lv4_arsenal',
            'lv2_drillCamp',
            'lv3_frontierLodge',
          ];
          const matchedProto = protoKeys.find(
            (k) =>
              b.id?.startsWith(k) ||
              b.id?.includes(k) ||
              b.dpName.toLowerCase().includes(k.replace(/_/g, '')),
          );
          if (matchedProto && !minimapLayers[matchedProto]) continue;
        }
        // If resource but resource group hidden, skip
        if (isResource && !minimapLayers.resourcesGroup) continue;
        ctx.fillRect(dx, dy, 2, 2);
      }
    }

    if (minimapLayers.alliancesGroup && minimapLayers.allianceBuildings) {
      for (const ub of userSnapshot) {
        const [sx, sy] = worldToScreen(ub.x, ub.y);
        const dx = (sx + halfWidth) * dynamicScale + shiftX;
        const dy = (sy + fullHeight) * dynamicScale + shiftY;
        ctx.fillStyle = ub.color || '#ffffff';
        ctx.fillRect(dx - 1, dy - 1, 3, 3);
      }
    }

    // Players
    if (minimapLayers.playersGroup && minimapLayers.players) {
      for (const p of players) {
        const [sx, sy] = worldToScreen(p.x, p.y);
        const dx = (sx + halfWidth) * dynamicScale + shiftX;
        const dy = (sy + fullHeight) * dynamicScale + shiftY;
        ctx.fillStyle = p.color || '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(dx, dy, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
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
    baseScale,
    fullHeight,
    minimapLayers,
    players,
    camScale,
    camX,
    camY,
  ]);

  // Dynamic overlay: viewport diamond (fast) on camera changes only
  useEffect(() => {
    if (!isOpen) return;
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const dpr = layoutCfg.pixelDensity || 1;
    canvas.width = Math.round(canvasW * dpr);
    canvas.height = Math.round(canvasH * dpr);
    canvas.style.width = canvasW + 'px';
    canvas.style.height = canvasH + 'px';
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
    const { scale: dynamicScale, shiftX, shiftY } = miniTransformRef.current;
    const poly = worldCorners.map(([wx, wy]) => {
      const [psx, psy] = worldToScreen(wx, wy);
      return [
        (psx + halfWidth) * dynamicScale + shiftX,
        (psy + fullHeight) * dynamicScale + shiftY,
      ] as [number, number];
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
    baseScale,
    fullHeight,
  ]);

  // Drag to pan main map (pointer events with activation thresholds)
  const pointerState = useRef<{
    isDown: boolean;
    isDragging: boolean;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    downTime: number;
    moved: number;
  }>({
    isDown: false,
    isDragging: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    downTime: 0,
    moved: 0,
  });

  const dragCfg = AppConfig.minimap.drag;

  const beginDragIfEligible = (now: number) => {
    const st = pointerState.current;
    if (st.isDragging) return true;
    if (!st.isDown) return false;
    if (now - st.downTime < dragCfg.startDelayMs) return false;
    if (st.moved < dragCfg.startDistancePx) return false;
    st.isDragging = true;
    return true;
  };

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const st = pointerState.current;
      st.isDown = true;
      st.isDragging = false;
      st.startX = st.lastX = e.clientX;
      st.startY = st.lastY = e.clientY;
      st.downTime = performance.now();
      st.moved = 0;
      try {
        (e.currentTarget as any).setPointerCapture(e.pointerId);
      } catch {}
    },
    [],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const st = pointerState.current;
      try {
        (e.currentTarget as any).releasePointerCapture(e.pointerId);
      } catch {}
      const totalMoved = st.moved;
      const wasDragging = st.isDragging;
      st.isDown = false;
      st.isDragging = false;
      // Treat as click if we never transitioned to dragging OR movement stayed under click threshold
      if (!wasDragging && totalMoved <= dragCfg.clickMaxDistancePx) {
        const canvas = baseCanvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const mx = e.clientX - rect.left;
          const my = e.clientY - rect.top;
          const { scale: dynScale, shiftX, shiftY } = miniTransformRef.current;
          const sx = (mx - shiftX) / dynScale - halfWidth;
          const sy = (my - shiftY) / dynScale - fullHeight;
          const tw2 = AppConfig.tileW / 2;
          const th2 = AppConfig.tileH / 2;
          const u = sx / tw2;
          const v = -sy / th2;
          const wx = (u + v) / 2;
          const wy = (v - u) / 2;
          if (wx >= 0 && wy >= 0 && wx <= AppConfig.N && wy <= AppConfig.N) {
            focusOn(Math.round(wx), Math.round(wy));
          }
        }
      }
    },
    [focusOn, halfWidth, fullHeight, dragCfg.clickMaxDistancePx],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const st = pointerState.current;
      if (!st.isDown) return;
      const dxRaw = e.clientX - st.lastX;
      const dyRaw = e.clientY - st.lastY;
      st.lastX = e.clientX;
      st.lastY = e.clientY;
      st.moved += Math.hypot(dxRaw, dyRaw);
      const now = performance.now();
      if (!beginDragIfEligible(now)) return; // still not a drag
      // Active drag -> smooth pan
      const canvas = baseCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const { scale: dynScale, shiftX, shiftY } = miniTransformRef.current;
      const sx = (mx - shiftX) / dynScale - halfWidth;
      const sy = (my - shiftY) / dynScale - fullHeight;
      const tw2 = AppConfig.tileW / 2;
      const th2 = AppConfig.tileH / 2;
      const u = sx / tw2;
      const v = -sy / th2;
      const targetWorldX = (u + v) / 2;
      const targetWorldY = (v - u) / 2;
      const cam = useCameraStore.getState();
      const [centerWorldX, centerWorldY] = screenToWorld(
        window.innerWidth / 2,
        window.innerHeight / 2,
        cam,
      );
      const diffWorldX = targetWorldX - centerWorldX;
      const diffWorldY = targetWorldY - centerWorldY;
      const [desiredScreenX, desiredScreenY] = worldToScreen(
        centerWorldX + diffWorldX,
        centerWorldY + diffWorldY,
      );
      const desiredCamX = window.innerWidth / 2 - desiredScreenX * cam.scale;
      const desiredCamY = window.innerHeight / 2 - desiredScreenY * cam.scale;
      const followFactor = AppConfig.minimap.followPanFactor;
      const panDX = (desiredCamX - cam.x) * followFactor;
      const panDY = (desiredCamY - cam.y) * followFactor;
      if (Math.abs(panDX) > 0.1 || Math.abs(panDY) > 0.1) {
        useCameraStore.getState().panBy(panDX, panDY);
      }
    },
    [halfWidth, fullHeight],
  );

  const handlePointerLeave = useCallback(() => {
    const st = pointerState.current;
    st.isDown = false;
    st.isDragging = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY;
    const stepIn = AppConfig.minimap.wheelZoomStepIn;
    const stepOut = AppConfig.minimap.wheelZoomStepOut;
    const zoomFactor = delta > 0 ? stepOut : stepIn;
    const camBefore = useCameraStore.getState();
    let newScale = camBefore.scale * zoomFactor;
    newScale = Math.max(
      AppConfig.camera.minScale,
      Math.min(AppConfig.camera.maxScale, newScale),
    );
    if (newScale === camBefore.scale) return;
    // Use viewport center world coordinate as focal point (stable, no jitter)
    const [worldX, worldY] = screenToWorld(
      window.innerWidth / 2,
      window.innerHeight / 2,
      camBefore,
    );
    const [screenXAfter, screenYAfter] = worldToScreen(worldX, worldY);
    const focalClientX = window.innerWidth / 2;
    const focalClientY = window.innerHeight / 2;
    const newCamX = focalClientX - screenXAfter * newScale;
    const newCamY = focalClientY - screenYAfter * newScale;
    useCameraStore
      .getState()
      .zoomTo({ x: newCamX, y: newCamY, scale: newScale });
  }, []);

  if (!isOpen) return null;

  return (
    <Panel className={styles.minimapPanel}>
      <div
        className={styles.canvasWrap}
        style={{ width: canvasW, height: canvasH }}
      >
        <canvas
          ref={baseCanvasRef}
          width={canvasW}
          height={canvasH}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onPointerMove={handlePointerMove}
          onWheel={handleWheel}
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
    </Panel>
  );
}
