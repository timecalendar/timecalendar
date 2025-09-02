"use client"

import { getApiErrorMessage } from "@/modules/shared/helpers/error-message"
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => toast.error(getApiErrorMessage(error)),
  }),
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastContainer />
      {children}
    </QueryClientProvider>
  )
}
