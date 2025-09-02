import { useEffect, useState } from "react"

interface NoSSRProps {
  children: React.ReactNode
}

/**
 * Component that prevents server-side rendering of its children.
 * Useful for components that rely on browser-only APIs or cause hydration mismatches.
 */
export function NoSSR({ children }: NoSSRProps) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return null
  }

  return <>{children}</>
}
