import { StrictMode } from 'react'
import { Provider } from 'react-redux'
import { createRoot } from 'react-dom/client'
import './index.css'
import { store } from '@/redux/store'
import { TooltipProvider } from '@/components/ui/tooltip'
import { RouterProvider } from 'react-router'
import { router } from './routes/index.tsx'
import { Toaster } from "react-hot-toast"

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
       <Toaster />
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>
    </Provider>
  </StrictMode>,
)
