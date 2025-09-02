import Image, { StaticImageData } from "next/image"
import { ReactNode } from "react"

interface Props {
  children?: ReactNode
  image?: string | StaticImageData
  legend?: string | ReactNode
}

const AssistantLayout = ({ children, image, legend }: Props) => {
  return (
    <div className="flex h-full">
      <div className="w-full md:w-1/2 shadow-sm h-full bg-white overflow-auto">
        <div className="max-w-md mx-auto px-4">{children}</div>
      </div>
      <div className="hidden md:flex md:w-1/2 items-center">
        <div className="max-w-md mx-auto px-4">
          {image ? (
            <div>
              <Image src={image} alt="Picture of the author" />
            </div>
          ) : null}
          {legend ? <div className="mt-1 text-center">{legend}</div> : null}
        </div>
      </div>
    </div>
  )
}

export default AssistantLayout
