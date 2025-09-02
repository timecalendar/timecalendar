"use client"

import { DesktopNavbar } from "modules/shared/components/navigation/DesktopNavbar"
import { MobileNavbar } from "modules/shared/components/navigation/MobileNavbar"

interface NavbarProps {
  transparent?: boolean
  className?: string
}

export function Navbar({ transparent = false, className }: NavbarProps) {
  return (
    <>
      <div className="hidden md:block">
        <DesktopNavbar transparent={transparent} className={className} />
      </div>
      <div className="block md:hidden">
        <MobileNavbar className={className} />
      </div>
    </>
  )
}
