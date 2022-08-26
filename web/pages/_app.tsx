import "styles/globals.css"
import "@fontsource/roboto/300.css"
import "@fontsource/roboto/400.css"
import "@fontsource/roboto/500.css"
import "@fontsource/roboto/700.css"
import type { AppProps } from "next/app"
import { AssistantContextProvider } from "modules/assistant/contexts/AssistantContext"

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AssistantContextProvider>
      <Component {...pageProps} />
    </AssistantContextProvider>
  )
}

export default MyApp
