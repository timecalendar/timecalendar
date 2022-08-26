export interface UrlRenamer {
  rename(url: string, school: string | null): string
}
