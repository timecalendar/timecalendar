import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { IconDefinition } from "@fortawesome/fontawesome-svg-core"
import { ReactNode } from "react"

interface FeatureProps {
  icon: IconDefinition
  title: string
  children: ReactNode
  className?: string
}

export function Feature({
  icon,
  title,
  children,
  className = "",
}: FeatureProps) {
  return (
    <div className={`text-center ${className}`}>
      <div className="mb-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#e66b8c] rounded-full">
          <FontAwesomeIcon
            icon={icon}
            className="w-6 h-6 text-white"
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="mb-2">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      </div>

      <p className="leading-relaxed">{children}</p>
    </div>
  )
}
