import { Box, CircularProgress } from "@mui/material"

const PageCircularProgress = () => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      height="100vh"
    >
      <CircularProgress size={32} />
    </Box>
  )
}

export default PageCircularProgress
