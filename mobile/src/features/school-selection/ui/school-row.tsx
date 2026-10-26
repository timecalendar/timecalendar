import { router } from "expo-router"
import { useTranslation } from "react-i18next"

import { ListRow } from "@/design"
import { emitExportGuideEvent } from "@/features/export-guides/ui"
import { decideIntranetUrl, useImportDraft } from "@/features/onboarding"
import { type SchoolListItem } from "@/features/school-selection/data"

import { LogoSize, SchoolLogo } from "./school-logo"

export function SchoolRow({ school }: { school: SchoolListItem }) {
  const { t } = useTranslation()
  const { setListedInstitution, setCalendarName } = useImportDraft()

  return (
    <ListRow
      testID={`onboarding-school-row-${school.id}`}
      label={school.name}
      hint={t("onboarding.school.rowHint")}
      leading={{
        element: (
          <SchoolLogo
            key={`${school.imageUrl}:${school.imageUrlDark ?? ""}`}
            school={school}
          />
        ),
        width: LogoSize,
      }}
      trailing="chevron"
      // The import journey (TIM-391), not the group step: `groups` persists a
      // selection and dismisses WITHOUT creating a calendar — a dead end. It
      // keeps its route and stays deep-linkable; deleting it is a separate
      // cleanup (design D10).
      onPress={() => {
        setListedInstitution(school)
        if (school.exportGuide.requireProgramme) {
          router.push("/onboarding/programme")
          return
        }
        setCalendarName("")
        if (school.exportGuide.requireConnect) {
          const intranet = decideIntranetUrl(school.intranetUrl)
          if (intranet.kind === "safe") {
            router.push("/onboarding/connect")
            return
          }
          emitExportGuideEvent({
            name: "export_guide_connect_skipped",
            params: {
              reason:
                intranet.kind === "missing" ? "missing_url" : "unsafe_url",
              provider_slug: school.exportGuide.providerSlug,
            },
          })
        }
        router.push("/onboarding/export-guide/0")
      }}
    />
  )
}
