import { createTheme, ThemeProvider } from "@mui/material/styles"
import { ReactNode } from "react"

const theme = createTheme({
  typography: {
    h2: {
      fontSize: "1.5rem",
      fontWeight: "bold",
    },
  },
  palette: {
    primary: {
      main: "#f72b61",
    },
    secondary: {
      main: "#666666",
    },
  },
})

export const AppThemeProvider = ({ children }: { children: ReactNode }) => {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}
