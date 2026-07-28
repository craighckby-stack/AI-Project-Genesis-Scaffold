# useAppConfig Architectural Blueprint

## Overview
The `useAppConfig` hook provides a reactive, persistent state management layer for Next.js applications. It bridges the gap between volatile React state and persistent `localStorage`.

## Technical Workflow
1. **Initialization**: Reads from `localStorage` on mount. Uses `try-catch` to handle malformed JSON.
2. **Synchronization**: Implements `window.addEventListener('storage')` to ensure that if a user changes a setting in one tab, all other tabs update in real-time.
3. **Persistence**: Every state update triggers a synchronous write to `localStorage` and a custom `StorageEvent` dispatch.

## Integration Schema
typescript
const [theme, setTheme] = useAppConfig<string>('app_theme', 'dark');


## Security & Performance
- **Memory Management**: Explicitly removes event listeners on component unmount.
- **Hydration Safety**: Checks for `typeof window` to prevent SSR errors.
- **Error Handling**: Gracefully falls back to `initialValue` if storage is corrupted.



