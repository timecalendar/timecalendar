// Initialize the single i18next instance for every test, mirroring the real
// app (i18n is wired at the root layout before any screen renders). Components
// under test call useTranslation()/t() against this instance, so without it
// they would render raw keys. The jest-expo device locale resolves to en, so
// tests assert the EN catalog values.
import "@/i18n"
