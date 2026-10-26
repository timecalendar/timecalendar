import { Redirect, Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import {
  NativeSettingsHost,
  NativeSettingsRow,
  NativeSettingsSection,
} from "@/components/chrome"
import { availableGalleryEntries, type GalleryEntry } from "@/design/gallery"
import { isDeveloperSurfaceEnabled } from "@/features/developer/access"

type Fixture = Pick<GalleryEntry, "metaId" | "title"> & {
  entries: GalleryEntry[]
}

function groupByFixture(entries: readonly GalleryEntry[]): Fixture[] {
  const fixtures = new Map<string, Fixture>()
  for (const entry of entries) {
    const fixture = fixtures.get(entry.metaId) ?? {
      metaId: entry.metaId,
      title: entry.title,
      entries: [],
    }
    fixture.entries.push(entry)
    fixtures.set(entry.metaId, fixture)
  }
  return [...fixtures.values()]
}

export function GalleryIndexScreen() {
  const { t } = useTranslation()

  if (!isDeveloperSurfaceEnabled()) return <Redirect href="/settings" />

  const galleryFixtures = groupByFixture(availableGalleryEntries())

  return (
    <>
      <Stack.Screen options={{ title: t("gallery.title") }} />
      <NativeSettingsHost>
        {galleryFixtures.map((fixture) => (
          <NativeSettingsSection
            key={fixture.metaId}
            title={t(fixture.title)}
            testID={`gallery-section-${fixture.metaId}`}
          >
            {fixture.entries.map((entry) => (
              <NativeSettingsRow
                key={entry.id}
                kind="navigation"
                label={t(entry.name)}
                hint={t("gallery.openStory.hint")}
                href={{
                  pathname: "/developer/gallery/[story]",
                  params: { story: entry.id },
                }}
                testID={`gallery-story-${entry.id}`}
              />
            ))}
          </NativeSettingsSection>
        ))}
      </NativeSettingsHost>
    </>
  )
}
