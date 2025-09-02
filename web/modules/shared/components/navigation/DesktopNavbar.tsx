"use client"

import { cn } from "modules/shared/utils"
import { navigationItems } from "modules/shared/components/navigation/navigationItems"
import Link from "next/link"

interface DesktopNavbarProps {
  transparent?: boolean
  className?: string
}

export function DesktopNavbar({
  transparent = false,
  className,
}: DesktopNavbarProps) {
  return (
    <nav
      className={cn(
        "w-full",
        transparent
          ? "absolute top-0 left-0 z-10 bg-transparent"
          : "relative bg-white shadow-sm",
        className,
      )}
      style={
        !transparent ? { boxShadow: "0 2px 4px rgba(0, 0, 0, .05)" } : undefined
      }
    >
      <div className="mx-auto max-w-7xl px-4 md:px-12">
        <div className="flex items-center justify-between h-24">
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-semibold text-gray-900">
              <Link href="/">TimeCalendar</Link>
            </h1>
          </div>
          <div className="flex items-center space-x-8">
            {navigationItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={cn(
                  "px-3 py-2 text-sm font-medium transition-colors duration-200",
                  transparent
                    ? "text-white hover:text-gray-200"
                    : "text-gray-700 hover:text-gray-900",
                )}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
