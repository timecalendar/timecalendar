import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet, View } from "react-native"

import { headerScrollProps, ListRow, ListSection, RootPage } from "@/design"
import type { ChangelogRelease } from "@/features/changelog/data"
import { Spacing } from "@/theme"

interface ChangelogContentProps {
  readonly releases: readonly ChangelogRelease[]
  readonly footer?: React.ReactNode
}

export function ChangelogContent({ releases, footer }: ChangelogContentProps) {
  const { t } = useTranslation()

  return (
    <RootPage scrollsUnderHeader testID="changelog-safe-area" lane="readable">
      {(layout) => (
        <ScrollView
          {...headerScrollProps(true)}
          testID="changelog-scroll-owner"
          contentContainerStyle={styles.scrollContent}
        >
          <View testID="changelog-responsive-content" style={layout.laneStyle}>
            {releases.map((release) => (
              <ListSection
                key={release.version}
                title={t("changelog.versionHeading", {
                  version: release.label,
                })}
                testID={`changelog-release-${release.version}`}
              >
                {release.items.map((item, index) => (
                  <ListRow
                    key={item.titleKey}
                    leading={{ icon: item.icon }}
                    label={t(item.titleKey)}
                    subtitle={t(item.subtitleKey)}
                    testID={`changelog-release-${release.version}-item-${index}`}
                  />
                ))}
              </ListSection>
            ))}
            {footer}
          </View>
        </ScrollView>
      )}
    </RootPage>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
  },
})
