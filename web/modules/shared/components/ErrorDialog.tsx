import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ReactNode } from "react"

interface Props {
  title?: string | ReactNode
  text?: string | ReactNode
  open?: boolean
  onClose: () => void
}

const ErrorDialog = ({ title, text, open, onClose }: Props) => {
  return (
    <Dialog
      open={open || false}
      onOpenChange={(isOpen) => !isOpen && onClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription asChild>
            <div>{text || "Une erreur est survenue."}</div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose} autoFocus>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ErrorDialog
