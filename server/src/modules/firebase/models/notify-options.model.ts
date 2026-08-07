export interface NotifyOptions {
  notification?: {
    title: string
    body: string
  }
  data?: { [key: string]: string }
  /** Android notification.tag + APNs apns-collapse-id: a later push with the
   * same id replaces the displayed one. */
  collapseId?: string
  /** FCM Android collapseKey: replaces the pending push in the offline queue. */
  collapseKey?: string
  /** iOS thread grouping (aps thread-id). */
  threadId?: string
}
