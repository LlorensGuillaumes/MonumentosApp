# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React Native mobile app (Expo 52, React 18) for exploring historical monuments across Spain, Portugal, and France. Supports 7 languages. Uses a local REST API backend.

## Commands

```bash
npm start          # Launch Expo dev server
npm run android    # Run on Android emulator/device
npm run ios        # Run on iOS simulator/device
npm run web        # Run in browser
```

No test framework is configured. No linter is configured.

## Architecture

### Navigation (src/navigation/AppNavigator.js)

Nested Tab + Stack pattern:
- **BottomTabNavigator**: Home (`HomeScreen`), Search (`SearchScreen`), Map (`MapScreen`)
- **Stack**: `Detail` screen renders as a modal overlay on top of tabs

### State Management (src/context/AppContext.js)

Context API + `useReducer`. The `useApp()` hook provides access to global state containing: stats, filter options (`filtros`), active filters, map bounds, loading/error states. All screens share this context via `AppProvider` wrapping the app.

### API Layer (src/services/api.js)

Axios client pointing to `http://10.0.2.2:3001/api` (Android emulator localhost proxy). Endpoints: `/stats`, `/monumentos`, `/monumentos/:id`, `/geojson`, `/filtros`, `/ccaa-resumen`, `/municipios`. 30s timeout.

### i18n (src/i18n/)

i18next + react-i18next with expo-localization for device language detection. 7 languages: es (default/fallback), en, fr, pt, ca, eu, gl. Translation JSON files in `src/i18n/locales/`. Use `useTranslation()` hook and `t()` function.

### Map (src/components/LeafletMap.js)

Leaflet + OpenStreetMap rendered inside a WebView via injected HTML. Communication between React Native and the map uses `postMessage`/`onMessage` bridge. Two view modes: CCAA summary (low zoom < 7) and detail markers (high zoom >= 7).

### Key Utilities

- **src/utils/colors.js**: Category color mapping, emoji icons, design system palette (primary: #3b82f6, dark: #1a365d)
- **src/utils/image.js**: Wikimedia image proxy via wsrv.nl to bypass CORS 403 errors. Handles HTTP→HTTPS conversion and URL encoding.

### Components

- **FilterModal**: Cascading filter selects (Country → Region → Province → Municipality) + classification filters
- **SearchableSelect**: Reusable modal dropdown with accent-insensitive search
- **MonumentoCard**: Two layouts (vertical grid, horizontal carousel) with image fallback placeholders
- **LanguageSelector**: Header dropdown for switching between 7 languages

## Key Patterns

- Images from Wikimedia are proxied through `wsrv.nl` — always use the helper in `src/utils/image.js`
- Monument image URLs use `|` as separator for multiple images
- Filter options are country-dependent (e.g., "Región/Distrito/Région" labels change per country)
- The app requires a running backend API on port 3001 for all data
