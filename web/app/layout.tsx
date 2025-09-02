import { Providers } from "@/app/providers"
import { Poppins } from "next/font/google"
import { PublicEnvScript } from "next-runtime-env"
import "styles/globals.css"

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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" href="assets/images/favicon.png" />

        <meta
          name="description"
          content="Consultez votre emploi du temps universitaire et recevez des notifications lors de modifications de cours grâce à votre nouvel assistant."
        />
        <meta name="author" content="Samuel Prak" />
        <meta
          name="image"
          content="https://timecalendar.app/assets/images/logo.png"
        />

        <meta property="og:title" content="TimeCalendar" />
        <meta property="og:site_name" content="TimeCalendar" />
        <meta
          property="og:description"
          content="Consultez votre emploi du temps universitaire et recevez des notifications lors de modifications de cours grâce à votre nouvel assistant."
        />
        <meta
          property="og:image"
          content="https://timecalendar.app/assets/images/logo.png"
        />
        <meta property="og:url" content="https://timecalendar.app/" />
        <meta property="og:type" content="website" />

        <link
          rel="image_src"
          type="image/png"
          href="https://timecalendar.app/assets/images/logo.png"
        />

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="TimeCalendar" />
        <meta name="twitter:site" content="@samuelprak_" />
        <meta
          name="twitter:description"
          content="Consultez votre emploi du temps universitaire et recevez des notifications lors de modifications de cours grâce à votre nouvel assistant."
        />
        <meta
          name="twitter:image"
          content="https://timecalendar.app/assets/images/logo.png"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
