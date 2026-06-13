import { createInstance } from "i18next"
import { initReactI18next } from "react-i18next"

import { detectLocale } from "./detect-locale"
import en from "./locales/en.json"
import fr from "./locales/fr.json"

// D5 — FR/EN key parity enforced at compile time. EN is the canonical key set
// (the typed-key augmentation in i18next.d.ts derives from it). The shared
// value type demands every EN key *and* every FR key on each catalog, so a
// missing or extra FR key is a `tsc` error in one direction or the other — the
// catalogs can never silently drift apart, and no key-as-fallback at runtime.
type Catalog = Record<keyof typeof en, string> & Record<keyof typeof fr, string>

const resources = {
  en: { translation: en },
  fr: { translation: fr },
} as const satisfies Record<"en" | "fr", { translation: Catalog }>

// One module-scoped instance, initialized synchronously from bundled catalogs
// (no network, no loading gate). initReactI18next registers it as
// react-i18next's default, so useTranslation() resolves it without a provider.
// keySeparator/nsSeparator false: a key is one flat dotted string, identical in
// code and catalog (D3).
const i18n = createInstance()

void i18n.use(initReactI18next).init({
  resources,
  lng: detectLocale(),
  fallbackLng: "en",
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false },
  // We render already-localized from synchronous bundled catalogs, so suspense
  // buys nothing — and disabling it removes the latent crash-with-no-boundary
  // risk if catalog loading ever becomes async (the D3 file-splitting escape).
  react: { useSuspense: false },
})

export default i18n
