import { Loader2 } from "lucide-react"

const PageCircularProgress = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="animate-spin" size={32} />
    </div>
  )
}

export default PageCircularProgress
