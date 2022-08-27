import { createTheme, ThemeProvider } from "@mui/material/styles"
import { ReactNode } from "react"

const theme = createTheme({
  palette: {
    primary: {
      main: "#f72b61",
    },
  },
})

export const AppThemeProvider = ({ children }: { children: ReactNode }) => {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}
