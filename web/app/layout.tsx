import { Providers } from "@/app/providers"
import { Poppins } from "next/font/google"
import { env, PublicEnvScript } from "next-runtime-env"
import "styles/globals.css"
import { ENV_VARS } from "@/lib/constants/env-vars"

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600"],
})

export const metadata = {
  title: "TimeCalendar - Votre emploi du temps universitaire",
  description:
    "Consultez votre emploi du temps universitaire et recevez des notifications lors de modifications de cours grâce à votre nouvel assistant.",
  authors: [{ name: "Samuel Prak" }],
  viewport: "width=device-width, initial-scale=1",
  icons: {
    icon: "/assets/images/favicon.png",
  },
  openGraph: {
    title: "TimeCalendar",
    siteName: "TimeCalendar",
    description:
      "Consultez votre emploi du temps universitaire et recevez des notifications lors de modifications de cours grâce à votre nouvel assistant.",
    images: [
      {
        url: `${env(ENV_VARS.NEXT_PUBLIC_FRONTEND_URL)}/assets/images/logo.png`,
        alt: "TimeCalendar Logo",
      },
    ],
    url: `${env(ENV_VARS.NEXT_PUBLIC_FRONTEND_URL)}/`,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "TimeCalendar",
    site: "@samuelprak_",
    description:
      "Consultez votre emploi du temps universitaire et recevez des notifications lors de modifications de cours grâce à votre nouvel assistant.",
    images: [
      `${env(ENV_VARS.NEXT_PUBLIC_FRONTEND_URL)}/assets/images/logo.png`,
    ],
  },
  other: {
    image_src: `${env(ENV_VARS.NEXT_PUBLIC_FRONTEND_URL)}/assets/images/logo.png`,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${poppins.className} antialiased`}>
      <head>
        <PublicEnvScript />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
