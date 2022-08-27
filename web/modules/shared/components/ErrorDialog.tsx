import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material"
import { ReactNode } from "react"

interface Props {
  title?: string | ReactNode
  text?: string | ReactNode
  open?: boolean
  onClose: () => void
}

const ErrorDialog = ({ title, text, open, onClose }: Props) => {
  return (
    <Dialog open={open || false}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {text || "Une erreur est survenue."}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} autoFocus>
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ErrorDialog
