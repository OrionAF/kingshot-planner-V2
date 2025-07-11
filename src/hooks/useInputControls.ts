// src/hooks/useInputControls.ts

import { useCameraStore } from '../state/useCameraStore';
import { screenToWorld, worldToScreen } from '../core/coordinate-utils';
import { useUiStore } from '../state/useUiStore';
import { useMapStore } from '../state/useMapStore';
import { AppConfig } from '../config/appConfig';

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
            // Auto-deselect if it's not a tower
            if (buildMode.selectedBuildingType !== 'alliance_tower') {
              setSelectedBuildingType(null);
            }
          }
        } else {
          if (import.meta.env.DEV) {
            console.log(`Click at: ${roundedX}, ${roundedY}`);
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

    // If in any placement mode, right-click cancels it.
    if (isPlacingPlayer || buildMode.selectedBuildingType) {
      exitPlacementMode();
      canvas.style.cursor = 'grab';
      return;
    }

    // Otherwise, attempt to delete an object.
    const { userBuildings, deleteBuilding, players, deletePlayer } =
      useMapStore.getState();
    const camera = useCameraStore.getState();
    const [worldX, worldY] = screenToWorld(e.clientX, e.clientY, camera);
    const roundedX = Math.round(worldX);
    const roundedY = Math.round(worldY);

    const buildingToDelete = userBuildings.find(
      (b) =>
        roundedX >= b.x &&
        roundedX < b.x + b.w &&
        roundedY >= b.y &&
        roundedY < b.y + b.h,
    );

    if (buildingToDelete) {
      if (window.confirm(`Delete this building?`)) {
        deleteBuilding(buildingToDelete.id);
      }
      return;
    }

    const playerToDelete = players.find(
      (p) =>
        roundedX >= p.x &&
        roundedX < p.x + p.w &&
        roundedY >= p.y &&
        roundedY < p.y + p.h,
    );

    if (playerToDelete) {
      if (window.confirm(`Delete player "${playerToDelete.name}"?`)) {
        deletePlayer(playerToDelete.id);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      const { exitPlacementMode } = useUiStore.getState();
      exitPlacementMode();
      canvas.style.cursor = 'grab';
    }
  };

  // ... (mouse leave, wheel, and touch handlers are unchanged)
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
    const [worldX, worldY] = screenToWorld(
      focalPoint.x,
      focalPoint.y,
      cameraBeforeZoom,
    );
    const [screenXAfter] = worldToScreen(worldX, worldY);
    // Y-coordinate has inverted screen space, need to recalculate Y differently
    const screenYAfterFrom0 = (worldX + worldY) * (AppConfig.tileH / 2);

    const newCamX = focalPoint.x - screenXAfter * newScale;
    const newCamY = focalPoint.y - screenYAfterFrom0 * newScale;
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
        const [worldX, worldY] = screenToWorld(
          focalPoint.x,
          focalPoint.y,
          cameraBeforeZoom,
        );
        const [screenXAfter] = worldToScreen(worldX, worldY);
        const screenYAfterFrom0 = (worldX + worldY) * (AppConfig.tileH / 2);
        const newCamX = focalPoint.x - screenXAfter * newScale;
        const newCamY = focalPoint.y - screenYAfterFrom0 * newScale;
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
