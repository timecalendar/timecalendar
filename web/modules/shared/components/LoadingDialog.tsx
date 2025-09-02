import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

interface Props {
  text?: string
  open?: boolean
}

const LoadingDialog = ({ text, open }: Props) => {
  return (
    <Dialog open={open || false}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {text || "Chargement..."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default LoadingDialog
