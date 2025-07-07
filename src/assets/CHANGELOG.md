# Changelog

All notable changes to this project will be documented in this file.

## [9.1.3.0] - Patch

### Changed
- **Improved Visual Hierarchy:** Alliance territory overlays are now rendered on top of placed players, and the fill color has been made slightly more opaque for better clarity.
- **Enhanced Player Readability:** Player castles are now drawn with a dark border, improving contrast and making them easier to distinguish when placed near other objects or similarly-colored territories.

## [9.1.2.0] - Patch

### Changed
- **Improved Player Panel Behavior:** The "Player Management" panel is now persistent and will remain open when clicking on the map, matching the behavior of the Alliance Management panel.

### Fixed
- **Fixed Building Deletion:** Corrected a critical bug that prevented right-clicking to delete alliance buildings (like towers and HQs) while in Build Mode.
- **Fixed UI Update:** The Build Menu now correctly updates its buttons (e.g., for limited-quantity buildings) immediately after a building is deleted.

## [9.1.1.0] - Patch

### Removed
- Disabled accidental dev mode, as it's useless outside of development.

## [9.1.0.0] - Minor

### Added
- **New Feature: Player Management (👤)!** A new dedicated sidebar panel has been added for placing and managing individual players on the map.
- **Place & Customize Players:** Users can now place unique 2x2 "player castles", each with a custom name, rally capacity (e.g., "687k"), and a user-selected color.
- **Edit Player Details:** An "Edit" button has been added for each player, allowing their name, rally capacity, and color to be modified at any time via a pop-up modal.
- **Intelligent Player Sorting:** The player list in the management panel is automatically sorted by the tag of the alliance territory a player resides in, making it easy to see who is where. Unaffiliated players are grouped at the end of the list.
- **Enhanced Placement UX:** Placing a player now a semi-transparent "ghost" tile at the cursor, providing a clear preview before clicking.
- **Integrated Player Controls:** The new sidebar provides `Go`, `Edit`, and `Delete` controls for each player, creating a workflow consistent with the Alliance Management panel.

## [9.0.1.0] - Patch

### Fixed
- Fixed versioning

## [9.0.0.0] - Major

### Added
- **New Map Features:** The map now includes new terrain types: **Ruins**, **Forbidden Areas**, and other **Unoccupiable** tiles. The build system correctly prevents placing structures on these special zones.
- **Building Placement Preview:** When selecting a building with a territory range (like a Tower or HQ), a semi-transparent preview of its coverage area is now shown at the cursor, allowing for more precise planning.
- **Enhanced Outpost Visuals:** Many outposts now render with unique, high-quality images instead of generic shapes, greatly improving visual identification across the map.
- **Safe Alliance Deletion:** A new two-step "Delete Mode" has been added to the Alliance Management panel to prevent accidental deletion of alliances and their associated buildings.

### Changed
- **Major UI/UX Overhaul:** The build system has been split into two distinct, more intuitive parts:
  - A persistent **Alliance Management** sidebar (🏰) for creating, editing, and viewing detailed alliance stats.
  - A pop-up **Build Menu** (🛠️) for entering build mode and selecting buildings to place.
- **Advanced Alliance Details:** Alliances in the management panel are now collapsible. When expanded, they reveal detailed statistics, including the number of towers built, and lists of controlled HQs, outposts, and resource nodes.
- **Territory Rendering Optimization:** The drawing of alliance territory has been significantly optimized for better performance and a cleaner, more continuous border.
- **Refined Minimap Behavior:** The minimap now intelligently switches between a static overview when the main map is zoomed out and a dynamic, context-aware view that follows the viewport when zoomed in.

### Fixed
- **Fixed Build Banner Readability:** The text color on the "Building as..." banner now automatically adjusts for high contrast against the selected alliance's color, ensuring it's always readable.
- **Fixed Info Banner Overlap:** The top "Overwatch" info banner now correctly shifts down when the "Build Mode" banner is active, preventing them from overlapping.
- **Fixed User Building Text:** Corrected the display text for user-placed buildings to properly include brackets around the alliance tag (e.g., `[ABC] PlainsHQ`). The text is also no longer bolded, improving clarity.
- **Fixed Chunk Rendering:** Resolved a bug where zoomed-out map chunks could incorrectly show the color of special areas (like Ruins) instead of the underlying base biome color.
- **Fixed Zoom Precision:** Resolved a potential issue where zoom level comparisons could fail due to floating-point inaccuracies, ensuring features like tile-merging trigger at the correct percentage.

## [8.0.1.0] - Patch

### Fixed
- **Fixed Critical Rendering Bug:** Resolved an issue where tiles would fail to render (appearing as black squares) if user-placed buildings or territory were hidden via the "Show at Zoom" setting. The map's base layer now always draws correctly.
- **Fixed Overwatch Tracking:** Corrected a bug where Outposts were not being properly identified and categorized, preventing them from being tracked by the Overwatch info banner.
- **Fixed Text Rendering on User Buildings:** Fixed an issue where the names on user-placed buildings (like HQs and Statues) were not scaling correctly and were always being rendered at the smallest possible font size.
- **Fixed UI Inconsistencies:**
  - Removed a redundant and confusing "Always Show Claimed Area" checkbox, consolidating its logic into the "Show Territory at Zoom" dropdown.
  - Corrected the values in the "Show at Zoom" dropdowns to accurately reflect their corresponding percentages.

## [8.0.0.0] - Major

### Added
- **New Feature: The Overwatch System!**
  - A new "Overwatch" (👁️) button and panel have been added to the toolbar.
  - This system tracks the landmark closest to the center of the screen and displays its name and coordinates in a new, non-intrusive banner at the top of the screen.
  - The Overwatch panel provides a hierarchical, collapsible checklist, allowing users to granularly enable or disable tracking for specific categories (Fortresses, Sanctuaries, etc.) or individual buildings.
- **Landmark Images:** Key buildings (King's Castle, Fortresses, Sanctuaries) are now rendered with high-quality images instead of simple colored shapes, dramatically improving the map's visual fidelity.
- **Dynamic Image Scaling:** Landmark images now intelligently scale up as the user zooms out. This is controlled by new configurable `imageScaleBreakpoint` values in the building data, ensuring buildings remain recognizable at a distance without overwhelming the view when zoomed in.
- **View & Setting Persistence:** The application now saves your work and preferences automatically.
  - The map's last known camera position and zoom level are saved to the browser, so your view is restored on refresh.
  - All selections made in the Overwatch panel are also saved and reloaded, preserving your tracking preferences between sessions.
- **Granular Render Controls:** The "Build Overlays" settings have been enhanced, splitting the old "Show at Zoom" control into two distinct dropdowns: one for "Show Territory at Zoom" and one for "Show Buildings at Zoom," giving users precise control over map clutter.

### Changed
- **Intelligent Info Banner Coloring:** The Overwatch info banner now automatically detects the brightness of the building's color it's displaying and sets the font color to either black or white for optimal contrast and readability.
- **Refined Overwatch Panel UI:** The "King's Castle" entry in the Overwatch panel is now a single, non-collapsible item for a cleaner and more logical user experience.

### Fixed
- **Fixed Critical Rendering Bug:** Resolved an issue where tiles would fail to render (appearing as black squares) if user-placed buildings were set to "Never" show, ensuring the base map always draws correctly.
- **Fixed Overwatch Tracking Logic:** Corrected a bug where Outposts and Alliance Resource Buildings were not being properly identified, preventing them from being tracked by the info banner.
- **Fixed Overwatch Panel Alignment:** Resolved a CSS layout issue where the "King's Castle" checkbox was misaligned with the other category checkboxes.

## [7.1.0.0] - Minor

### Added
- **Building Limits:** A new rule system has been implemented. All buildings except for Alliance Towers are now limited to one per alliance, preventing the placement of duplicates. The "Buildings" palette now intelligently disables buttons for buildings that have reached their limit.
- **Coverage Preview:** When selecting a building with a coverage area (like a Tower or HQ), a semi-transparent preview of its territory range is now shown at the mouse cursor, allowing for precise placement before clicking.
- **Default Buildings Additions:** Added a few Outposts and unoccupiable tiles to the map.

### Changed
- **Optimized Territory Borders:** The rendering of alliance territory has been significantly improved. Instead of drawing a border around every individual tile, the system now draws a single, clean outline around the entire territory, improving both performance and visual clarity.
- **Enhanced Minimap Responsiveness:** The minimap's panning and zooming logic has been drastically improved. It now immediately and aggressively centers on your viewport as you zoom, ensuring the viewport indicator remains visible and useful at all zoom levels.
- **Redesigned Building Palette:** The floating "Buildings" button now toggles a compact, two-column palette that slides in from the right, improving usability and screen real estate. Button text is now centered for a cleaner look.

### Fixed
- Fixed a critical bug that prevented the map from being dragged while in Build Mode. Panning now works correctly, except when a building is actively selected for placement.
- Corrected a text rendering issue where building names with multiple lines (e.g., "Lv.2 Arsenal") were not centered properly within their footprint.
- Fixed a bug that prevented the 'Landmarks' tab in the Navigation panel from being clickable.
- Fixed an issue where opening other panels (like Settings or the Buildings palette) would incorrectly exit Build Mode.
- Fixed a bug where the building palette would not correctly update its disabled buttons (for limited-quantity buildings) unless it was already open when a building was placed or deleted.
- Corrected display text for user-placed buildings to include a space between the alliance tag and the building name (e.g., "ABS PlainsHQ" instead of "ABSPlainsHQ").

## [7.0.1.0] - Patch

### Changed
- **Redesigned Building Palette:** The floating "Buildings" button now toggles a compact, two-column palette that slides in from the right, improving usability and screen real estate. Button text is now centered for a cleaner look.

### Fixed
- Fixed a critical bug that prevented the map from loading on startup.
- Fixed an issue where the list of alliances would not populate from browser backups when opening the 'Manage Plan' panel.
- Alliance Tags on user-placed buildings will now correctly appear only when zoomed in beyond 30%.
- Fixed a logic error that prevented the creation of alliances with 3-character tags.
- The "Building as..." banner now correctly updates its color immediately after selecting a new alliance.
- Opening and closing the 'Manage Plan / Alliances' panel no longer incorrectly exits Build Mode.

## [7.0.0.0] - Major

### Added
- **Introducing Build Mode!**
*A comprehensive new system for planning alliance territory and building layouts.*
  - **Alliance Creation:** Create and manage multiple alliances, each with a unique name, 3-character tag, and color.
  - **Building Placement:** Place 8 different types of alliance buildings, including Towers, HQs for each biome, and prestige statues.
  - **Claimed Territory:** Towers and HQs automatically project a colored **Claimed Area** on the map. The system uses the same "first-come, first-served" hierarchy as in game, preventing territory from being claimed by more than one alliance.
- **Save & Share Your Plans!**
  - **Import/Export:** You can now save your complete build plans (alliances and buildings) to a `.json` file and import them later to share with others or continue your work.
  - **Automatic Browser Backups:** Your current plan is automatically saved in your browser, preventing data loss if you accidentally close the tab.
  - **Clear Plan:** A new "Clear Plan" button has been added to the Settings panel to easily start a new design from scratch.
- **UI for Building:**
  - A floating "Buildings" palette appears on the right side of the screen when in Build Mode for rapid placement of structures.
  - A "Always Show Claimed Area" toggle has been added to the Settings panel, allowing you to see territory overlays even when not in Build Mode.
  - The 🛠️ "Build" button opens a dedicated management panel. A separate "Enter/Exit Build Mode" button within this panel provides more intentional control.
  - The top "Build Mode" banner changes color to match the currently selected alliance.

## [6.1.1.0] - Patch

### Added
- **Collapsible Changelog:** The "What's New?!" window now features collapsible sections for each version, making it much easier to browse past updates.

### Changed
- The latest version's notes are now expanded by default for immediate visibility.
- All older versions are now collapsed by default, significantly reducing clutter and scrolling.
- Changed the versioning of previous and future updates.  It was becoming a mess.  

## [6.1.0.0] - Minor

### Added
- **Dedicated Pinned Bookmarks Panel:** Added a new 'Pinned Landmarks' (📌) button and panel to the toolbar for direct, one-click access to favorite locations, improving on the previous nested menu.

### Changed
- **Complete UI/UX Overhaul:** Consolidated all controls into a new, modern bottom toolbar for a cleaner, more intuitive experience on both desktop and mobile.
  - Features like Navigation, Bookmarks, and Settings now open in sleek pop-up panels anchored to the toolbar.
  - The central zoom slider now dynamically expands to fill available toolbar space.
- **Improved Navigation:** The main 'Navigation' (🧭) panel is now streamlined, with separate tabs for 'Go To' and for browsing/pinning available 'Landmarks'.
- **Updated Icons:** Refreshed toolbar icons for a clearer, more modern look.

### Fixed
- **Smarter Minimap State:** The minimap now correctly defaults to being visible on desktop screens and hidden on mobile, providing a better out-of-the-box experience for all users.
- **Correct Panel Positioning:** The 'Zoom Presets' panel now opens correctly adjacent to its button on the toolbar, instead of from the center of the screen.
- **Proper Landmark Sorting:** The 'Available Landmarks' list is now correctly sorted with "King's Castle" appearing first, followed by Fortresses and Sanctuaries.
- **Functional Controls Modal:** The 'Controls' button in the Settings panel now opens a proper, informative modal window instead of a basic system alert.
- **Smoother Minimap Interaction:** Removed the pan animation after dragging on the minimap, which prevents a "snap-back" effect and makes navigation feel more direct.
- **Building Render Bug:** Fixed a rendering bug in low-detail (chunked) view where some buildings were not being drawn correctly.

## [6.0.0.0] - Major

### Added
- **Complete Mobile UI Overhaul!** The application now features a dedicated, modern user interface for mobile devices in portrait mode.
  - A new, ergonomic bottom toolbar provides easy thumb access to all major functions.
  - Buttons for Zoom, Fit to Screen, Search, Bookmarks, and Settings are now consolidated in the toolbar.
- **Mobile Modal Panels:** To maximize map visibility, Search, Bookmarks, and Settings now open in clean, full-screen overlay panels instead of cluttering the main view.

### Changed
- The previous responsive layout, which simply hid desktop elements, has been entirely replaced by the new purpose-built mobile UI for a vastly improved user experience on phones.
- The desktop layout remains unchanged for large screens.
- Landscape mode on mobile now uses a simplified horizontal zoom control layout to maximize the view.

### Fixed
- All features, including settings and multi-pin bookmarks, are now fully accessible on mobile devices.

## [5.2.1.0] - Patch

### Changed
- Re-made the mobile layout.  This is just a test.

## [5.2.0.0] - Minor

### Changed
- **Bookmarks can now be multi-pinned!** Instead of a single pinned favorite, you can now pin an unlimited number of landmarks.
- Pinned bookmarks are now displayed as a persistent list in the top-right corner for immediate access. Each item has its own 'Go' and 'Unpin' buttons.
- The expandable bookmark menu is now solely for adding new pins from a list of available (unpinned) landmarks.

## [5.1.0.0] - Minor

### Added
- **New Advanced Bookmarks System!**
  - Replaced the basic dropdown with a new expandable bookmark menu located conveniently under the minimap.
  - **Pin a Favorite:** You can now pin a landmark! The pinned location is displayed when the menu is closed and is remembered across sessions.
  - Each bookmark now has its own "Go" button for one-click navigation.

### Changed
- **Major UI Layout Overhaul:**
  - The performance stats (FPS, Tiles) have been moved to a permanently visible panel in the top-left corner.
  - The `Settings` button and panel have been relocated to the bottom-right corner. The panel now expands upwards.
  - The version number display has been moved to the bottom-left corner for a cleaner layout.
- The bookmark menu now smoothly slides up to fill the space when the minimap is hidden.
- Adjusted the height of the vertical zoom slider for better compatibility with various screen aspect ratios.
- On smaller screens (under 768px wide), only the minimap is hidden, keeping the new bookmark and settings panels accessible.

### Removed
- The previous bookmark dropdown from within the `Settings` panel.
- The `Stats` button (📊), as the performance stats are now always visible.

## [5.0.0.0] - Major

### Added
- **New Feature: Bookmarks!** 
A new dropdown menu has been added to the Settings panel, allowing you to instantly jump to any Fortress, Sanctuary or the King's Castle.
- Added new `+10%` and `-10%` buttons to the zoom controls for faster, larger zoom adjustments.

### Changed
- The "Go To" and "Bookmark" navigation functions now zoom to a standard 100% level, providing a more consistent experience.
- The layout of the left-side zoom controls has been adjusted to accommodate the new buttons.
- The "Presets" dropdown now resets to a placeholder after a selection is made, allowing you to select a value, zoom in/out, and select the same value again.

## [4.1.1.0] - Patch

### Fixed
- **Tile selecting:** Fixed the single tile selecting feature which broke in the last major update.  Before this update, it only worked for building tiles.  This has now been fixed.


## [4.1.0.0] - Minor

### Changed
- Refactored the patch notes system to load and render directly from this `CHANGELOG.md` file.
- This simplifies the update process and ensures a single source of truth for all changes.

### Removed
- The `patch_notes.json` file is no longer used by the application and has been deprecated.

## [4.0.0.0] - Major

### Changed
- The minimap has been completely rebuilt to render as a true isometric representation of the main map, instead of a simple 2D grid.
- The minimap now intelligently zooms and pans to stay focused on your viewport, providing better contextual awareness when zoomed in, while remaining static at low zoom.
- The zoom slider has been moved further to the left of the screen and made longer to make it easier to use.
- The coordinate search box has been moved to the bottom center of the screen.
- UI elements now dynamically resize and reposition based on the available space to support various screen sizes and devices.
  - The minimap is now hidden on displays with a width less than 768px.
  - The tool detects if the screen is in landscape or portrait mode and adjusts the layout accordingly.

### Added
- **New Zoom Presets:** Replaced the zoom preset buttons with a more compact dropdown menu and added a wider range of presets: 5%, 10%, 15%, 20%, 40%, 60%, and 80%.
- **More Tile-Merging Presets:** Added new tile-merging presets for 20%, 40%, 50%, 60%, 70% and 80% zoom levels for more granular performance control.

### Fixed
- **Predictable Zooming:** Corrected the behavior of the `+` / `–` zoom buttons. They now increment/decrement the zoom by exactly 1% instead of a variable amount, providing more precise control.

## [3.3.2.0] - Patch

### Changed
- Updated viewport camera icon.
- Other minor tweaks.

## [3.3.1.0] - Patch

### Changed
- The minimap viewport indicator is now drawn as a diamond, accurately reflecting the main map's isometric camera view.
- The fill and border colors of the minimap viewport indicator have been adjusted for better contrast against biome colors.
- The minimap toggle button has been made slimmer with reduced padding and a slightly smaller font for a less obtrusive look.
- Minimap canvas internal padding has been significantly reduced, minimizing the visible 'border' effect from the background color.

## [3.3.0.0] - Minor

### Added
- The minimap can now be shown or hidden using a new integrated toggle button.

### Changed
- The minimap has been significantly enlarged for better visibility and detail.
- The toggle button is styled as a sleek bar at the top of the minimap, effectively replacing the previous thick padding border for a cleaner look.

## [3.2.1.0] - Patch

### Changed
- Made some improvements to the minimap.

## [3.2.0.0] - Minor

### Added
- Implemented **Markdown** support for displaying patch notes using the `marked.js` library.

### Changed
- Notes can now include *italics*, **bold text**, lists, and other Markdown features for improved readability.

## [3.1.0.0] - Minor

### Changed
- The minimap now dynamically zooms relative to the main map's zoom level.
- The minimap's view now centers on the main map's current viewport.
- Adjusted the 'Fit' zoom level to ensure better map visibility on load.
- Improved minimap scale calculation and added further guards against invalid numeric states.

### Fixed
- Resolved an issue where the Settings panel would overlap the minimap when opened.
- Corrected main map drawing functions to resolve a black screen issue.

## [3.0.0.0] - Major

### Added
- A new minimap is now available in the top-right corner, providing an overview of the entire game world.
- Display toggles, Performance settings, and Info/Stats are now consolidated into a new collapsible '⚙️ Settings' panel in the top-right.

### Changed
- Key structures (King's Castle, Fortresses) and Biome regions are now displayed on the minimap.
- The 'Go To' coordinate search has been moved to the top of the left-side panel.
- Updated the Stats button icon to 📊.
- Clicking on the minimap will now instantly pan the main map to that location.

### Fixed
- Corrected a minor HTML class name typo in the patch notes modal footer.

## [2.0.3.0] - Patch

### Changed
- Made some minor performance improvements.

## [2.0.2.0] - Patch

### Changed
- Made a few tweaks to adjust zooming feel and responsiveness.

## [2.0.1.0] - Patch

### Fixed
- Attempted to fix an issue with the statistics panel not updating correctly.

## [2.0.0.0] - Major

### Added
- Added a 'ping' effect: selections now flash briefly to make them easier to locate on the map.

### Changed
- Completed a major internal code refactor for improved long-term stability and easier future updates.
- The settings panel in the top-right has been reorganized with headers for better clarity.

### Fixed
- Fixed a minor performance issue where buildings were being drawn twice.

## [1.5.0.0] - Minor

### Added
- Added a new 'Always Show RSS' toggle for Alliance RSS buildings. When enabled, this will keep Alliance RSS buildings visible on the map at all zoom levels.

### Fixed
- Fixed a rendering bug that was causing buildings to be drawn twice in high-detail view.

## [1.4.2.0] - Patch

### Changed
- Refactored the building rendering logic to be more efficient.

### Fixed
- Fixed a critical bug where Alliance RSS buildings were not filling their entire 2x2 area, leaving parts of the tile uncolored.

## [1.4.1.0] - Patch

### Fixed
- Fixed a bug where Alliance RSS buildings were rendered as 1x1 tiles instead of the correct 2x2 size.
- Fixed an issue where the names of Alliance RSS buildings (e.g., 'Wood', 'Food') were not being displayed on the map.

## [1.4.0.0] - Minor

### Added
- A new toggleable layer for 'Alliance RSS' buildings.
- Alliance resource nodes (Wood, Food, Stone, Iron) will now render on the map with unique colors.
- A new 'Show Alliance RSS' checkbox has been added to control their visibility.

## [1.3.0.0] - Minor

### Added
- New 'Tile Detail' setting now controls only when tiles merge together at low zoom levels.
- New 'Show Gridlines' checkbox gives users direct control over gridline visibility.

### Changed
- Replaced the confusing 'Quality' dropdown with two separate, clearer settings.

## [1.2.0.0] - Minor

### Added
- Added a 'Quality' dropdown menu in the top-right panel.

### Changed
- Users can now choose their preferred performance vs. visual quality setting.
- The selected quality setting is saved and remembered for your next visit.

## [1.1.3.0] - Patch

### Changed
- Made improvements to the zoom camera behavior.

## [1.1.2.0] - Patch

### Changed
- Changed the color palette of existing buildings.
- Implemented Sanctuaries on the map.

## [1.1.1.0] - Patch

### Fixed
- Fixed the patch notes not showing and updating correctly.

## [1.1.0.0] - Minor

### Changed
- Improved the vertical zoom slider for better precision and a more consistent layout on different screen sizes.
- Optimized application startup by moving patch notes to an external file.

## [1.0.0.0] - Major

### Added
- Added a vertical zoom slider on the left.
- Added this patch notes window and versioning system.

### Changed
- Redesigned UI layout for improved usability.
- Implemented a configurable display for tile coordinates.

### Fixed
- Fixed building name text overflowing its container.

## [0.0.0.1] - Initial Release

### Added
- Initial public release version with core features.