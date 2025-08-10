// src/hooks/useInputControls.ts

import { useCameraStore } from '../state/useCameraStore';
import { screenToWorld, worldToScreen } from '../core/coordinate-utils';
import { useUiStore } from '../state/useUiStore';
import { useMapStore, getBiomeForTile } from '../state/useMapStore';
import { useSelectionStore } from '../state/useSelectionStore';
import { AppConfig } from '../config/appConfig';
import type { BaseBuilding, Player, UserBuilding } from '../types/map.types';

type HitDetectionResult =
  | { type: 'player'; data: Player }
  | { type: 'userBuilding'; data: UserBuilding }
  | { type: 'baseBuilding'; data: BaseBuilding }
  | null;

function getObjectAtCoords(x: number, y: number): HitDetectionResult {
  const { players, userBuildings, buildingMap } = useMapStore.getState();

  const player = players.find(
    (p) => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h,
  );
  if (player) return { type: 'player', data: player };

  const userBuilding = userBuildings.find(
    (b) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h,
  );
  if (userBuilding) return { type: 'userBuilding', data: userBuilding };

  const baseBuilding = buildingMap.get(`${x},${y}`);
  if (baseBuilding) return { type: 'baseBuilding', data: baseBuilding };

  return null;
}

export function createInputHandlers(canvas: HTMLCanvasElement) {
  const { panBy, zoomTo } = useCameraStore.getState();

  let isPointerDown = false;
  let lastPanPos = { x: 0, y: 0 };
  let clickStartPos = { x: 0, y: 0 };
  let lastPinchDist = 0;

  const handleMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return;
    isPointerDown = true;
    clickStartPos = { x: e.clientX, y: e.clientY };
    lastPanPos = { x: e.clientX, y: e.clientY };
    const { isPlacingPlayer, buildMode } = useUiStore.getState();
    if (!isPlacingPlayer && !buildMode.selectedBuildingType) {
      canvas.style.cursor = 'grabbing';
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    const camera = useCameraStore.getState();
    const {
      isPlacingPlayer,
      buildMode,
      setMouseWorldPosition,
      setPlacementValidity,
    } = useUiStore.getState();

    if (isPlacingPlayer || buildMode.selectedBuildingType) {
      canvas.style.cursor = 'crosshair';
    } else if (isPointerDown) {
      canvas.style.cursor = 'grabbing';
    } else {
      canvas.style.cursor = 'grab';
    }

    const [worldX, worldY] = screenToWorld(e.clientX, e.clientY, camera);
    const roundedX = Math.round(worldX);
    const roundedY = Math.round(worldY);
    setMouseWorldPosition({ x: roundedX, y: roundedY });

    if (isPlacingPlayer || buildMode.selectedBuildingType) {
      const { checkPlacementValidity } = useMapStore.getState();
      const type = isPlacingPlayer ? 'player' : buildMode.selectedBuildingType!;
      const isValid = checkPlacementValidity(
        roundedX,
        roundedY,
        type,
        buildMode.activeAllianceId,
      );
      setPlacementValidity(isValid);
    }

    if (!isPointerDown) return;
    panBy(e.clientX - lastPanPos.x, e.clientY - lastPanPos.y);
    lastPanPos = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (e.button !== 0) return;

    if (isPointerDown) {
      const dist = Math.hypot(
        e.clientX - clickStartPos.x,
        e.clientY - clickStartPos.y,
      );
      if (dist < 5) {
        const uiStore = useUiStore.getState();
        const mapStore = useMapStore.getState();
        const camera = useCameraStore.getState();
        const { setSelection } = useSelectionStore.getState();

        const [worldX, worldY] = screenToWorld(e.clientX, e.clientY, camera);
        const roundedX = Math.round(worldX);
        const roundedY = Math.round(worldY);

        const {
          isPlacingPlayer,
          playerToPlace,
          endPlayerPlacement,
          buildMode,
          setSelectedBuildingType,
          isValidPlacement,
        } = uiStore;

        if (isPlacingPlayer && playerToPlace) {
          if (isValidPlacement) {
            mapStore.placePlayer(playerToPlace, roundedX, roundedY);
            endPlayerPlacement();
          }
        } else if (
          buildMode.selectedBuildingType &&
          buildMode.activeAllianceId
        ) {
          if (isValidPlacement) {
            mapStore.placeBuilding(
              buildMode.selectedBuildingType,
              roundedX,
              roundedY,
              buildMode.activeAllianceId,
            );
            if (buildMode.selectedBuildingType !== 'alliance_tower') {
              setSelectedBuildingType(null);
            }
          }
        } else {
          const clickedObject = getObjectAtCoords(roundedX, roundedY);
          if (clickedObject) {
            setSelection(clickedObject);
          } else {
            setSelection({ type: 'tile', data: { x: roundedX, y: roundedY } });
          }
          if (import.meta.env.DEV && AppConfig.enableDevMode) {
            const biome = getBiomeForTile(roundedX, roundedY);
            console.log(`Click at: ${roundedX}, ${roundedY} (Biome: ${biome})`);
          }
        }
      }
    }
    isPointerDown = false;
    canvas.style.cursor = 'grab';
  };

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();

    const { isPlacingPlayer, buildMode, exitPlacementMode } =
      useUiStore.getState();

    if (isPlacingPlayer || buildMode.selectedBuildingType) {
      exitPlacementMode();
      canvas.style.cursor = 'grab';
      return;
    }

    const { deleteBuilding, deletePlayer } = useMapStore.getState();
    const camera = useCameraStore.getState();
    const [worldX, worldY] = screenToWorld(e.clientX, e.clientY, camera);
    const roundedX = Math.round(worldX);
    const roundedY = Math.round(worldY);

    const objectToDelete = getObjectAtCoords(roundedX, roundedY);

    if (objectToDelete?.type === 'userBuilding') {
      if (window.confirm(`Delete this building?`)) {
        deleteBuilding(objectToDelete.data.id);
      }
    } else if (objectToDelete?.type === 'player') {
      if (window.confirm(`Delete player "${objectToDelete.data.name}"?`)) {
        deletePlayer(objectToDelete.data.id);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      const { exitPlacementMode } = useUiStore.getState();
      const { clearSelection } = useSelectionStore.getState();
      exitPlacementMode();
      clearSelection();
      canvas.style.cursor = 'grab';
    }
  };

  const handleMouseLeave = () => {
    isPointerDown = false;
    canvas.style.cursor = 'grab';
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const cameraBeforeZoom = useCameraStore.getState();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    let newScale = cameraBeforeZoom.scale * zoomFactor;
    newScale = Math.max(
      AppConfig.camera.minScale,
      Math.min(newScale, AppConfig.camera.maxScale),
    );
    const focalPoint = { x: e.clientX, y: e.clientY };

    // THE FIX: Use the globally correct functions to find the world point under the mouse,
    // then convert that back to its new screen position with the new scale.
    const [worldX, worldY] = screenToWorld(
      focalPoint.x,
      focalPoint.y,
      cameraBeforeZoom,
    );
    const [screenXAfter, screenYAfter] = worldToScreen(worldX, worldY);

    const newCamX = focalPoint.x - screenXAfter * newScale;
    const newCamY = focalPoint.y - screenYAfter * newScale;
    zoomTo({ x: newCamX, y: newCamY, scale: newScale });
  };

  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      lastPanPos = { x: touch.clientX, y: touch.clientY };
    } else if (e.touches.length >= 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      lastPinchDist = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY,
      );
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const dx = touch.clientX - lastPanPos.x;
      const dy = touch.clientY - lastPanPos.y;
      panBy(dx, dy);
      lastPanPos = { x: touch.clientX, y: touch.clientY };

      const { isPlacingPlayer, buildMode, setPlacementValidity } =
        useUiStore.getState();
      if (isPlacingPlayer || buildMode.selectedBuildingType) {
        const camera = useCameraStore.getState();
        const { checkPlacementValidity } = useMapStore.getState();
        const [worldX, worldY] = screenToWorld(
          window.innerWidth / 2,
          window.innerHeight / 2,
          camera,
        );
        const type = isPlacingPlayer
          ? 'player'
          : buildMode.selectedBuildingType!;
        const isValid = checkPlacementValidity(
          Math.round(worldX),
          Math.round(worldY),
          type,
          buildMode.activeAllianceId,
        );
        setPlacementValidity(isValid);
      }
    } else if (e.touches.length >= 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const focalPoint = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      };
      const cameraBeforeZoom = useCameraStore.getState();
      const newDist = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY,
      );
      if (lastPinchDist > 0) {
        const zoomFactor = newDist / lastPinchDist;
        let newScale = cameraBeforeZoom.scale * zoomFactor;
        newScale = Math.max(
          AppConfig.camera.minScale,
          Math.min(newScale, AppConfig.camera.maxScale),
        );

        // THE FIX: Use the globally correct functions for pinch-to-zoom as well.
        const [worldX, worldY] = screenToWorld(
          focalPoint.x,
          focalPoint.y,
          cameraBeforeZoom,
        );
        const [screenXAfter, screenYAfter] = worldToScreen(worldX, worldY);

        const newCamX = focalPoint.x - screenXAfter * newScale;
        const newCamY = focalPoint.y - screenYAfter * newScale;
        zoomTo({ x: newCamX, y: newCamY, scale: newScale });

        const { isPlacingPlayer, setPlacementValidity, buildMode } =
          useUiStore.getState();
        if (isPlacingPlayer || buildMode.selectedBuildingType) {
          const camera = useCameraStore.getState();
          const { checkPlacementValidity } = useMapStore.getState();
          const [centerX, centerY] = screenToWorld(
            window.innerWidth / 2,
            window.innerHeight / 2,
            camera,
          );
          const type = isPlacingPlayer
            ? 'player'
            : buildMode.selectedBuildingType!;
          const isValid = checkPlacementValidity(
            Math.round(centerX),
            Math.round(centerY),
            type,
            buildMode.activeAllianceId,
          );
          setPlacementValidity(isValid);
        }
      }
      lastPinchDist = newDist;
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      lastPanPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if (e.touches.length < 2) {
      lastPinchDist = 0;
    }
  };
  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleKeyDown,
    handleContextMenu,
  };
}
