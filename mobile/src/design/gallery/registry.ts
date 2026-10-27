import * as dateTimePicker from "@/components/chrome/date-time-picker.gallery"
import * as floatingAction from "@/components/chrome/floating-action.gallery"
import * as glassSurface from "@/components/chrome/glass-surface.gallery"
import * as headerAction from "@/components/chrome/header-action.gallery"
import * as menuView from "@/components/chrome/menu-view.gallery"
import * as nativeList from "@/components/chrome/native-list.gallery"
import * as nativeListNumericEditor from "@/components/chrome/native-list-numeric-editor.gallery"
import * as nativeTextEntryDialog from "@/components/chrome/native-text-entry-dialog.gallery"
import * as badge from "@/design/badge/badge.gallery"
import * as button from "@/design/button/button.gallery"
import * as buttonRow from "@/design/button/button-row.gallery"
import * as colorDot from "@/design/color-dot/color-dot.gallery"
import * as eventSurface from "@/design/event-surface/event-surface.gallery"
import * as colorSwatchField from "@/design/field/color-swatch-field.gallery"
import * as dateTimeField from "@/design/field/date-time-field.gallery"
import * as textField from "@/design/field/text-field.gallery"
import * as icon from "@/design/icon/icon.gallery"
import * as adaptiveContent from "@/design/layout/adaptive-content.gallery"
import * as keyboardSafeActionLayout from "@/design/layout/keyboard-safe-action-layout.gallery"
import * as rootPage from "@/design/layout/root-page.gallery"
import * as listRow from "@/design/list/list-row.gallery"
import * as listSection from "@/design/list/list-section.gallery"
import * as separator from "@/design/list/separator.gallery"
import * as errorSurfaces from "@/design/status/error-surfaces.gallery"
import * as statusView from "@/design/status/status-view.gallery"
import * as themedText from "@/design/text/themed-text.gallery"
import * as themedView from "@/design/text/themed-view.gallery"
import * as thumbnail from "@/design/thumbnail/thumbnail.gallery"
import * as designTokens from "@/theme/tokens.gallery"

import type { GalleryModule } from "./types"

export const galleryModules: readonly GalleryModule[] = [
  rootPage,
  adaptiveContent,
  keyboardSafeActionLayout,
  themedText,
  themedView,
  icon,
  statusView,
  errorSurfaces,
  button,
  buttonRow,
  textField,
  dateTimeField,
  colorSwatchField,
  listRow,
  listSection,
  separator,
  badge,
  colorDot,
  thumbnail,
  eventSurface,
  nativeList,
  nativeTextEntryDialog,
  nativeListNumericEditor,
  menuView,
  headerAction,
  floatingAction,
  dateTimePicker,
  glassSurface,
  designTokens,
]
