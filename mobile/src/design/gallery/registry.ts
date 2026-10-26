import * as button from "@/components/button.gallery"
import * as dateTimePicker from "@/components/chrome/date-time-picker.gallery"
import * as glassSurface from "@/components/chrome/glass-surface.gallery"
import * as menuView from "@/components/chrome/menu-view.gallery"
import * as nativeSettings from "@/components/chrome/native-settings.gallery"
import * as nativeSettingsNumericEditor from "@/components/chrome/native-settings-numeric-editor.gallery"
import * as nativeTextEntryDialog from "@/components/chrome/native-text-entry-dialog.gallery"
import * as emptyState from "@/components/empty-state.gallery"
import * as errorSurfaces from "@/components/error-surfaces.gallery"
import * as keyboardSafeActionLayout from "@/components/keyboard-safe-action-layout.gallery"
import * as rootPage from "@/components/root-page.gallery"
import * as themedText from "@/components/themed-text.gallery"
import * as designTokens from "@/theme/tokens.gallery"

import type { GalleryModule } from "./types"

export const galleryModules: readonly GalleryModule[] = [
  rootPage,
  keyboardSafeActionLayout,
  themedText,
  emptyState,
  errorSurfaces,
  button,
  nativeSettings,
  nativeTextEntryDialog,
  nativeSettingsNumericEditor,
  menuView,
  dateTimePicker,
  glassSurface,
  designTokens,
]
