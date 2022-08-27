import "styles/globals.scss"
import "@fontsource/roboto/300.css"
import "@fontsource/roboto/400.css"
import "@fontsource/roboto/500.css"
import "@fontsource/roboto/700.css"
import type { AppProps } from "next/app"
import { AssistantContextProvider } from "modules/assistant/contexts/AssistantContext"
import { QueryCache, QueryClient, QueryClientProvider } from "react-query"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { NoSsr } from "@mui/material"
import { AppThemeProvider } from "modules/shared/context/AppThemeProvider"
import { getApiErrorMessage } from "modules/shared/helpers/error-message"

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => toast.error(getApiErrorMessage(error)),
  }),
})

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AppThemeProvider>
      <QueryClientProvider client={queryClient}>
        <NoSsr>
          <AssistantContextProvider>
            <Component {...pageProps} />
            <ToastContainer />
          </AssistantContextProvider>
        </NoSsr>
      </QueryClientProvider>
    </AppThemeProvider>
  )
}

export default MyApp
