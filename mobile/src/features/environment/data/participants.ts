// Calendar mutation/sync state is owned by TanStack Query or component-local
// hooks. The root unmounts those hooks while resetting; QueryClient clearing
// removes the durable mutation state. This explicit participant remains the
// registration point if calendar gains module-scoped state later.
export function resetCalendarRuntimeState(): void {}

export { resetNotificationRuntimeState } from "@/features/notifications/data"
