export interface NotifyOptions {
  notification?: {
    title: string
    body: string
  }
  data?: { [key: string]: string }
}
