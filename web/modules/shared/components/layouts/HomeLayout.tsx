import { PropsWithChildren } from "react"
import { Navbar } from "modules/shared/components/navigation"
import { Footer } from "./Footer"

interface HomeLayoutProps extends PropsWithChildren {
  transparentNavbar?: boolean
}

export function HomeLayout({
  children,
  transparentNavbar = false,
}: HomeLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar transparent={transparentNavbar} />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  )
}
