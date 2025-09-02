export interface NavigationItem {
  label: string
  href: string
  isActive?: boolean
}

export const navigationItems: NavigationItem[] = [
  {
    label: "ACCUEIL",
    href: "#",
    isActive: true,
  },
]
