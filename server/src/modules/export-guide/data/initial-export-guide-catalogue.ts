import { S3_PUBLIC_BUCKET_CLIENT_URL } from "config/constants"
import {
  EXPORT_GUIDE_PROVIDER_KIND,
  EXPORT_GUIDE_SCHEMA_VERSION,
  ExportGuideCatalogueV1,
  ExportGuideLocale,
  ExportGuidePageV1,
  INITIAL_EXPORT_GUIDE_PROVIDER_SLUGS,
} from "modules/export-guide/models/export-guide.model"
import { ExportGuideValidationError } from "modules/export-guide/validation/export-guide-validation.error"

export const INITIAL_EXPORT_GUIDE_VERSION = "2026-09-07.1"
export const E2E_EXPORT_GUIDE_VERSION = "2026-09-08.t4"
export const E2E_EXPORT_GUIDE_ASSET_ORIGIN =
  "https://timecalendar-dev-public.fra1.digitaloceanspaces.com"

export const resolveInitialExportGuideAssetOrigin = (value: string): string => {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new ExportGuideValidationError("asset_origin")
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new ExportGuideValidationError("asset_origin")
  return url.origin
}

export const INITIAL_EXPORT_GUIDE_ASSET_ORIGIN =
  resolveInitialExportGuideAssetOrigin(S3_PUBLIC_BUCKET_CLIENT_URL)

const image = (
  path: string,
  byteSize: number,
  width: number,
  height: number,
  altText: string,
  caption: string,
) => ({
  url: `${INITIAL_EXPORT_GUIDE_ASSET_ORIGIN}/export-guides/${INITIAL_EXPORT_GUIDE_VERSION}/${path}`,
  mimeType: "image/png" as const,
  byteSize,
  width,
  height,
  altText,
  caption,
})

const frPages: Record<string, readonly ExportGuidePageV1[]> = {
  ade: [
    {
      title: "Sélectionnez vos groupes",
      description:
        "Dans la partie gauche d'ADE, sélectionnez tous les groupes et cours auxquels vous appartenez.",
      image: image(
        "fr/ade/groupes.png",
        54779,
        1500,
        934,
        "Liste des groupes dans ADE",
        "Sélectionnez tous vos groupes dans la partie gauche.",
      ),
    },
    {
      title: "Ouvrez l'exportation",
      description:
        "Cliquez sur l'icône d'exportation du calendrier en bas à gauche.",
      image: image(
        "fr/ade/export.png",
        11098,
        582,
        224,
        "Icône d'exportation d'ADE",
        "Cliquez sur l'icône du calendrier.",
      ),
    },
    {
      title: "Configurez la période",
      description:
        "Choisissez les dates de début et de fin de votre année universitaire, puis générez l'URL.",
      image: image(
        "fr/ade/periode.png",
        54079,
        582,
        351,
        "Fenêtre de configuration de la période ADE",
        "Sélectionnez les dates de début et de fin.",
      ),
    },
    {
      title: "Copiez l'URL",
      description:
        "Copiez l'adresse du lien iCal généré afin de l'ajouter dans TimeCalendar.",
      image: image(
        "fr/ade/url.png",
        28895,
        714,
        349,
        "URL iCal générée par ADE",
        "Copiez l'adresse du lien affiché.",
      ),
    },
  ],
  hplanning: [
    {
      title: "Ouvrez l'exportation",
      description:
        "Dans la rubrique Cours, ouvrez votre emploi du temps puis cliquez sur l'icône Agenda en haut à droite.",
      image: image(
        "fr/hplanning/export.png",
        28429,
        340,
        231,
        "Icône Agenda dans Hyperplanning",
        "Cliquez sur l'icône Agenda.",
      ),
    },
    {
      title: "Copiez l'URL",
      description:
        "Conservez Toutes les semaines publiées, puis copiez l'URL affichée dans la zone de texte.",
      image: image(
        "fr/hplanning/url.png",
        48726,
        440,
        481,
        "Fenêtre d'exportation Hyperplanning",
        "Choisissez toutes les semaines publiées et copiez l'URL.",
      ),
    },
  ],
  celcat: [
    {
      title: "Sélectionnez votre groupe",
      description:
        "En haut à gauche, choisissez votre groupe dans le menu déroulant.",
      image: image(
        "fr/celcat/groupes.png",
        23142,
        940,
        478,
        "Menu de sélection des groupes Celcat",
        "Sélectionnez votre groupe.",
      ),
    },
    {
      title: "Sélectionnez toutes les semaines",
      description: "Dans le menu de période, choisissez Toutes les semaines.",
      image: image(
        "fr/celcat/semaines.png",
        104627,
        969,
        661,
        "Menu de sélection des semaines Celcat",
        "Sélectionnez toutes les semaines.",
      ),
    },
    {
      title: "Copiez le lien ICS",
      description:
        "Faites un clic droit sur ICS, puis choisissez Copier l'adresse du lien.",
      image: image(
        "fr/celcat/ics.png",
        17175,
        389,
        176,
        "Lien ICS dans Celcat",
        "Copiez l'adresse du lien ICS.",
      ),
    },
  ],
  generic: [
    {
      title: "Affichez votre emploi du temps",
      description:
        "Ouvrez la page de votre emploi du temps sur le site ou l'intranet de votre établissement.",
      image: image(
        "fr/generic/calendrier.png",
        54779,
        1500,
        934,
        "Exemple d'emploi du temps universitaire",
        "Affichez votre emploi du temps.",
      ),
    },
    {
      title: "Exportez le calendrier",
      description:
        "Cherchez l'option d'export iCal ou ICS et sélectionnez toute votre période universitaire si nécessaire.",
    },
    {
      title: "Copiez l'URL",
      description:
        "Copiez l'adresse du lien iCal ou ICS généré afin de l'ajouter dans TimeCalendar.",
    },
  ],
}

const enPages: Record<string, readonly ExportGuidePageV1[]> = {
  ade: [
    {
      title: "Select your groups",
      description:
        "In the left side of ADE, select every group and class you attend.",
      image: image(
        "en/ade/groups.png",
        54779,
        1500,
        934,
        "Group list in ADE",
        "Select all your groups on the left.",
      ),
    },
    {
      title: "Open the export tool",
      description: "Select the calendar export icon in the lower-left corner.",
      image: image(
        "en/ade/export.png",
        11098,
        582,
        224,
        "ADE export icon",
        "Select the calendar icon.",
      ),
    },
    {
      title: "Configure the date range",
      description:
        "Choose the start and end dates of your academic year, then generate the URL.",
      image: image(
        "en/ade/range.png",
        54079,
        582,
        351,
        "ADE date range dialog",
        "Choose the start and end dates.",
      ),
    },
    {
      title: "Copy the URL",
      description:
        "Copy the generated iCal link address so you can add it to TimeCalendar.",
      image: image(
        "en/ade/url.png",
        28895,
        714,
        349,
        "iCal URL generated by ADE",
        "Copy the displayed link address.",
      ),
    },
  ],
  hplanning: [
    {
      title: "Open the export tool",
      description:
        "Open your timetable from Classes, then select the Agenda icon in the top-right corner.",
      image: image(
        "en/hplanning/export.png",
        28429,
        340,
        231,
        "Agenda icon in Hyperplanning",
        "Select the Agenda icon.",
      ),
    },
    {
      title: "Copy the URL",
      description:
        "Keep All published weeks selected, then copy the URL shown in the text area.",
      image: image(
        "en/hplanning/url.png",
        48726,
        440,
        481,
        "Hyperplanning export dialog",
        "Select all published weeks and copy the URL.",
      ),
    },
  ],
  celcat: [
    {
      title: "Select your group",
      description: "In the upper-left corner, choose your group from the menu.",
      image: image(
        "en/celcat/groups.png",
        23142,
        940,
        478,
        "Celcat group selection menu",
        "Select your group.",
      ),
    },
    {
      title: "Select every week",
      description: "In the period menu, choose All weeks.",
      image: image(
        "en/celcat/weeks.png",
        104627,
        969,
        661,
        "Celcat week selection menu",
        "Select all weeks.",
      ),
    },
    {
      title: "Copy the ICS link",
      description: "Right-click ICS, then choose Copy link address.",
      image: image(
        "en/celcat/ics.png",
        17175,
        389,
        176,
        "ICS link in Celcat",
        "Copy the ICS link address.",
      ),
    },
  ],
  generic: [
    {
      title: "Display your timetable",
      description:
        "Open your timetable page on your institution's website or intranet.",
      image: image(
        "en/generic/calendar.png",
        54779,
        1500,
        934,
        "Example university timetable",
        "Display your timetable.",
      ),
    },
    {
      title: "Export the calendar",
      description:
        "Find the iCal or ICS export option and select your full academic period when necessary.",
    },
    {
      title: "Copy the URL",
      description:
        "Copy the generated iCal or ICS link address so you can add it to TimeCalendar.",
    },
  ],
}

const labels = {
  fr: {
    ade: "ADE",
    hplanning: "Hyperplanning",
    celcat: "Celcat",
    generic: "Autre emploi du temps",
  },
  en: {
    ade: "ADE",
    hplanning: "Hyperplanning",
    celcat: "Celcat",
    generic: "Other timetable",
  },
} as const

export const createInitialExportGuideCatalogue = (
  locale: ExportGuideLocale,
): ExportGuideCatalogueV1 => ({
  schemaVersion: EXPORT_GUIDE_SCHEMA_VERSION,
  catalogueVersion: INITIAL_EXPORT_GUIDE_VERSION,
  locale,
  providers: INITIAL_EXPORT_GUIDE_PROVIDER_SLUGS.map((slug) => ({
    slug,
    label: labels[locale][slug as keyof (typeof labels)[typeof locale]],
    kind: EXPORT_GUIDE_PROVIDER_KIND,
    selectable: true,
    compatibility: {
      minClientSchema: EXPORT_GUIDE_SCHEMA_VERSION,
      maxClientSchema: EXPORT_GUIDE_SCHEMA_VERSION,
    },
    pages: (locale === "fr" ? frPages : enPages)[slug],
  })),
})

export const createE2eExportGuideCatalogue = (
  locale: ExportGuideLocale,
): ExportGuideCatalogueV1 => {
  const catalogue = structuredClone(createInitialExportGuideCatalogue(locale))
  const replaceFixtureIdentity = (url: string) => {
    const parsed = new URL(url)
    return `${E2E_EXPORT_GUIDE_ASSET_ORIGIN}${parsed.pathname.replace(
      INITIAL_EXPORT_GUIDE_VERSION,
      E2E_EXPORT_GUIDE_VERSION,
    )}`
  }
  const providers = catalogue.providers.map((provider) => ({
    ...provider,
    pages: provider.pages.map((page) => ({
      ...page,
      ...(page.image
        ? {
            image: {
              ...page.image,
              url: replaceFixtureIdentity(page.image.url),
            },
          }
        : {}),
    })),
  }))
  const generic = providers.find((provider) => provider.slug === "generic")
  if (generic?.pages[0]?.image) {
    const page = generic.pages[0]
    const pageImage = page.image!
    generic.pages[0] = {
      ...page,
      image: {
        ...pageImage,
        url: `${E2E_EXPORT_GUIDE_ASSET_ORIGIN}/export-guides/${E2E_EXPORT_GUIDE_VERSION}/${locale}/generic/controlled-broken.png`,
      },
    }
  }
  return {
    ...catalogue,
    catalogueVersion: E2E_EXPORT_GUIDE_VERSION,
    providers,
  }
}
