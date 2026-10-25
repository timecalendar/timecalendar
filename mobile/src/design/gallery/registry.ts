import * as nativeSettings from "@/components/chrome/native-settings.gallery"
import * as nativeTextEntryDialog from "@/components/chrome/native-text-entry-dialog.gallery"

import type { GalleryModule } from "./types"

export const galleryModules: readonly GalleryModule[] = [
  nativeSettings,
  nativeTextEntryDialog,
]
