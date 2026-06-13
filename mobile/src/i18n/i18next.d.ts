import "react-i18next"

import en from "./locales/en.json"

// Typed keys (D4): the t() key argument is the union of EN catalog keys, so a
// missing or mistyped key is a compile error, not a silent key-as-fallback.
// keySeparator: false mirrors the runtime so keys stay flat dotted strings.
declare module "react-i18next" {
  interface CustomTypeOptions {
    resources: { translation: typeof en }
    keySeparator: false
  }
}
