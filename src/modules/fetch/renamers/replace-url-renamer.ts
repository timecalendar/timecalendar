import { UrlRenamer } from "./url-renamer"

export class ReplaceUrlRenamer implements UrlRenamer {
  constructor(
    private readonly searchValue: string | RegExp,
    private readonly replaceValue: string,
  ) {}

  rename(url: string) {
    return url.replace(this.searchValue, this.replaceValue)
  }
}
