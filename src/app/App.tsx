import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from '@/components/ui/toast'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/contexts/AuthContext'
import { AppRoutes } from '@/router/routes'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // An enterprise user opens six tabs and comes back to them. Refetching
      // on every focus makes the app feel busy without being fresher.
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* AuthProvider is inside BrowserRouter because its consumers use
            router hooks, and inside QueryClientProvider because it reads
            authorization through a query. */}
        <AuthProvider>
          <TooltipProvider delayDuration={200}>
            <AppRoutes />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
