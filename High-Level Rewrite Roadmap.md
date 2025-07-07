#### **Phase 1: Foundation & Project Setup (1-2 Days)**
*The goal of this phase is to establish the development environment and project structure. There will be no visible application yet.*

*   **Step 1: Initialize the Project**
    *   Use Vite to create a new project with the React + TypeScript template: `npx create-vite@latest kingshot-planner-v2 --template react-ts`.
    *   Set up a Git repository and make your initial commit.

*   **Step 2: Establish Directory Structure**
    *   Create a logical folder structure within `src/` that reflects the new architecture:
        *   `assets/`: For images and other static files.
        *   `components/`: For reusable React components (e.g., `<Panel>`, `<Button>`).
        *   `features/`: For feature-specific components and logic (e.g., `AlliancePanel`, `BuildMenu`).
        *   `core/`: For core engine logic (Renderer, Camera, Input Handling).
        *   `state/`: For global state management (Zustand or Redux Toolkit stores).
        *   `types/`: For shared TypeScript type definitions (e.g., `Building`, `Alliance`).
        *   `hooks/`: For custom React hooks (e.g., `useAnimationLoop`).

*   **Step 3: Port Configuration & Static Assets**
    *   Move the static configuration from `KingshotPlanner.config` into a typed `src/config.ts` file.
    *   Move all map data (`baseMap.json`, `CHANGELOG.md`) and images into the appropriate asset folders.

*   **Critical Note:** A solid foundation is paramount. Spending a day getting this structure right will save weeks of refactoring later.

---

#### **Phase 2: Core Rendering & The Map (3-5 Days)**
*The goal is to render the basic, non-interactive isometric map on the screen.*

*   **Step 1: Create the Canvas Component**
    *   Build a `<MapCanvas />` React component that renders a single `<canvas>` element and manages its lifecycle.

*   **Step 2: Develop the Renderer**
    *   Create a `CanvasRenderer` class in `src/core/renderer.ts`. It will be responsible for all direct `ctx` drawing commands.
    *   The `MapCanvas` component will instantiate this renderer and pass it the canvas context.
    *   Port the fundamental drawing logic: `getBiomeForTile`, `worldToScreen`, `drawTile`, `drawChunk`.

*   **Step 3: Implement the Animation Loop**
    *   Create a custom hook, `useAnimationLoop(callback)`, which encapsulates the `requestAnimationFrame` logic.
    *   The `MapCanvas` component will use this hook to call `renderer.renderFrame()` on every tick.

*   **Critical Note:** Focus on absolute decoupling. The `CanvasRenderer` should know nothing about React. Its only job is to draw what it's told, based on the data it's given.

---

#### **Phase 3: Camera, Input, and Basic Interaction (2-4 Days)**
*The goal is to make the map interactive with pan, zoom, and selection capabilities.*

*   **Step 1: Manage Camera State**
    *   Use a state management solution (Zustand is recommended for its simplicity) to create a `useCameraStore` that holds `{ x, y, scale }`.
    *   The renderer will read directly from this store on every frame to apply the correct view transform.

*   **Step 2: Handle User Input**
    *   Create a `useInputControls` hook that attaches mouse and touch event listeners to the canvas.
    *   These listeners will not manipulate the camera directly. Instead, they will call actions on the `useCameraStore` (e.g., `panBy(dx, dy)`, `zoom(factor, anchor)`).

*   **Step 3: Implement Selection Logic**
    *   When the canvas is clicked, the input handler will perform a `screenToWorld` calculation.
    *   Create a `useSelectionStore` to hold the currently selected tile or building. The click handler will update this store.
    *   The renderer will read from this selection store to draw the yellow highlight.

*   **Critical Note:** This establishes the core data flow: **Input -> Modifies State -> Renderer Reads State**. This pattern is fundamental to the entire application and should be strictly adhered to.

---

#### **Phase 4: Data Layers & Object Rendering (2-4 Days)**
*The goal is to display all the static and user-generated objects on the map.*

*   **Step 1: Type All Data Structures**
    *   In `src/types/`, create detailed TypeScript interfaces for `Building`, `Alliance`, `Player`, `Landmark`, etc.

*   **Step 2: Create a Master `useMapStore`**
    *   This will be your primary global state store.
    *   It will hold all dynamic application data: `alliances`, `buildModeBuildings`, `placedPlayers`.
    *   It will also contain the logic (actions) for modifying this data, ported from the original file: `createAlliance`, `placeBuilding`, `deletePlayer`, `recalculateAllClaimedTerritory`.

*   **Step 3: Load & Render Data**
    *   The main `<App />` component will be responsible for fetching `baseMap.json` and populating the store with default buildings.
    *   The renderer will now read from `useMapStore` to get the list of buildings and players to draw on each frame.

*   **Critical Note:** TypeScript's power will be most apparent here. Strongly typing your state will prevent a massive number of potential bugs when porting the complex placement and territory logic.

---

#### **Phase 5: Rebuilding UI Panels & The "Chrome" (5-7 Days)**
*The goal is to recreate all the UI panels as modular React components.*

*   **Step 1: Create Reusable Base Components**
    *   Build a small library of your own generic components in `src/components/`: `<Panel>`, `<Button>`, `<Input>`, `<Modal>`, etc. This avoids code duplication.

*   **Step 2: Rebuild Each Feature Panel**
    *   One by one, recreate each UI panel (Settings, Alliance Management, Player Management, etc.) as a React component in its `src/features/` directory.
    *   Each panel will read its data *from* the relevant store (e.g., `useMapStore`) and will call actions *on* the store to make changes.

*   **Step 3: Implement the Bottom Toolbar**
    *   Recreate the bottom toolbar, connecting its buttons to open/close the feature panels and to call actions on the camera and selection stores.

*   **Critical Note:** This is where React shines. The UI will now be a pure function of the application state. When the state updates (e.g., an alliance is created), the UI will automatically and efficiently re-render to reflect that change, with no manual DOM manipulation required.

---

#### **Phase 6: Final Polish, Optimization, and Deployment (Ongoing)**
*The goal is to prepare the application for launch and future development.*

*   **Step 1: WebGL Transition (Optional but Recommended)**
    *   With the rendering logic now fully abstracted in the `CanvasRenderer`, you can begin developing a parallel `WebGLRenderer`.
    *   Start by rendering just the base tile map in WebGL for a massive performance boost. You can keep rendering UI overlays and text with a secondary 2D canvas on top.

*   **Step 2: Implement Save/Load**
    *   The "Export Plan" functionality now becomes trivial: it simply serializes the state from `useMapStore` to JSON. "Import Plan" deserializes JSON and populates the store.

*   **Step 3: Thorough Testing & QA**
    *   Rigorously test every feature, comparing its behavior against the live legacy version to ensure no regressions.
    *   Focus heavily on mobile responsiveness and touch interactions.

*   **Step 4: Automate Deployment**
    *   Use GitHub Actions to create a CI/CD pipeline. On every push to the `main` branch, it should automatically run `npm run build` and deploy the contents of the `dist/` folder to your `gh-pages` branch.