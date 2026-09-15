import { AccessProvider } from './state/AccessContext.jsx'
import { AppProvider } from './state/AppContext.jsx'
import { SupportProvider } from './state/SupportContext.jsx'
import AppRoutes from './router.jsx'

export default function App() {
  return (
    <AppProvider>
      <AccessProvider>
        <SupportProvider>
          <AppRoutes />
        </SupportProvider>
      </AccessProvider>
    </AppProvider>
  )
}
