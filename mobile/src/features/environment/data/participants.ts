// Calendar mutation/sync state is owned by TanStack Query or component-local
// hooks. The root unmounts those hooks while resetting; QueryClient clearing
// removes the durable mutation state. This explicit participant remains the
// registration point if calendar gains module-scoped state later.
export function resetCalendarRuntimeState(): void {}

// Notification preferences are MMKV-owned and cleared by the classified
// storage participant. Registration hooks are unmounted during reset and a
// reload creates a fresh registration lifecycle on the target backend.
export function resetNotificationRuntimeState(): void {}
