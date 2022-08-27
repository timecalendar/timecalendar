import {
  CircularProgress,
  Dialog,
  DialogContent,
  DialogContentText,
} from "@mui/material"
import { Stack } from "@mui/system"

interface Props {
  text?: string
  open?: boolean
}

const LoadingDialog = ({ text, open }: Props) => {
  return (
    <Dialog open={open || false}>
      <DialogContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <CircularProgress size={32} />
          <DialogContentText>{text || "Chargement..."}</DialogContentText>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}

export default LoadingDialog
