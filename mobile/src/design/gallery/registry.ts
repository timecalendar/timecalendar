import * as dateTimePicker from "@/components/chrome/date-time-picker.gallery"
import * as glassSurface from "@/components/chrome/glass-surface.gallery"
import * as menuView from "@/components/chrome/menu-view.gallery"
import * as nativeSettings from "@/components/chrome/native-settings.gallery"
import * as nativeSettingsNumericEditor from "@/components/chrome/native-settings-numeric-editor.gallery"
import * as nativeTextEntryDialog from "@/components/chrome/native-text-entry-dialog.gallery"
import * as button from "@/design/button/button.gallery"
import * as buttonRow from "@/design/button/button-row.gallery"
import * as icon from "@/design/icon/icon.gallery"
import * as adaptiveContent from "@/design/layout/adaptive-content.gallery"
import * as keyboardSafeActionLayout from "@/design/layout/keyboard-safe-action-layout.gallery"
import * as rootPage from "@/design/layout/root-page.gallery"
import * as emptyState from "@/design/status/empty-state.gallery"
import * as errorSurfaces from "@/design/status/error-surfaces.gallery"
import * as themedText from "@/design/text/themed-text.gallery"
import * as themedView from "@/design/text/themed-view.gallery"
import * as designTokens from "@/theme/tokens.gallery"

import type { GalleryModule } from "./types"

export const galleryModules: readonly GalleryModule[] = [
  rootPage,
  adaptiveContent,
  keyboardSafeActionLayout,
  themedText,
  themedView,
  icon,
  emptyState,
  errorSurfaces,
  button,
  buttonRow,
  nativeSettings,
  nativeTextEntryDialog,
  nativeSettingsNumericEditor,
  menuView,
  dateTimePicker,
  glassSurface,
  designTokens,
]
