import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout.jsx'
import Dashboard from './pages/rm/Dashboard.jsx'
import CustomerDetail from './pages/rm/CustomerDetail.jsx'
import RmAnalytics from './pages/rm/Analytics.jsx'
import Scans from './pages/pm/Scans.jsx'
import Campaigns from './pages/pm/Campaigns.jsx'
import Assistant from './pages/pm/Assistant.jsx'
import DeepDive from './pages/pm/DeepDive.jsx'
import Studio from './pages/pm/Studio.jsx'
import SavedDesigns from './pages/pm/SavedDesigns.jsx'
import NewDesign from './pages/pm/NewDesign.jsx'
import Flow from './pages/pm/Flow.jsx'
import Workflows from './pages/pm/Workflows.jsx'
import PmAnalytics from './pages/pm/OnboardingAnalytics.jsx'
import ApplicantJourney from './pages/pm/ApplicantJourney.jsx'
import Users from './pages/pm/Users.jsx'
import UserDetail from './pages/pm/UserDetail.jsx'
import Roles from './pages/pm/Roles.jsx'
import Support from './pages/pm/Support.jsx'
import SupportTicket from './pages/pm/SupportTicket.jsx'

function CustomerCompat() {
  const { id } = useParams()
  return <Navigate to={`/customers/${id}`} replace />
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* There is no front door any more. The console opens on the
            portfolio Assistant, and the profile menu in the header is how you
            cross to the lifecycle view. */}
        <Route index element={<Navigate to="/pm/assistant" replace />} />
        {/* Customer queue lives at a neutral URL so both PM and RM sidebars
            can reach it without switching view context. */}
        <Route path="customers" element={<Dashboard />} />
        <Route path="customers/:id" element={<CustomerDetail />} />
        <Route path="rm" element={<Navigate to="/customers" replace />} />
        <Route path="rm/customer/:id" element={<CustomerCompat />} />
        <Route path="rm/analytics" element={<RmAnalytics />} />
        {/* The console's front door. Every way into the portfolio view lands
            on the Assistant, so a bare /pm goes there too rather than 404ing
            out to the view picker. */}
        <Route path="pm" element={<Navigate to="/pm/assistant" replace />} />
        <Route path="pm/scans" element={<Scans />} />
        <Route path="pm/campaigns" element={<Campaigns />} />
        <Route path="pm/assistant" element={<Assistant />} />
        <Route path="pm/deep-dive" element={<DeepDive />} />
        {/* The studio is the editor. Browsing what exists and starting
            something new are their own screens, reached from the sidebar,
            because neither belongs in a 236px rail beside an artboard. */}
        <Route path="pm/studio" element={<Studio />} />
        <Route path="pm/studio/designs" element={<SavedDesigns />} />
        <Route path="pm/studio/new" element={<NewDesign />} />
        <Route path="pm/analytics" element={<PmAnalytics />} />
        <Route path="pm/analytics/applicant/:id" element={<ApplicantJourney />} />
        <Route path="pm/flow" element={<Navigate to="/pm/flow/0" replace />} />
        <Route path="pm/flow/:step" element={<Flow />} />
        <Route path="pm/workflows" element={<Workflows />} />
        <Route path="pm/workflows/:id" element={<Workflows />} />
        {/* The desk's side of support: the queue, and one ticket at a time. The
            reference is the URL, so a ticket somebody quotes can be opened. */}
        <Route path="pm/support" element={<Support />} />
        <Route path="pm/support/:id" element={<SupportTicket />} />
        <Route path="pm/users" element={<Users />} />
        <Route path="pm/users/:id" element={<UserDetail />} />
        <Route path="pm/roles" element={<Roles />} />
        {/* These screens used to live under /admin. They are part of the PM
            console now, so the old paths only redirect. */}
        <Route path="admin" element={<Navigate to="/pm/users" replace />} />
        <Route path="admin/*" element={<Navigate to="/pm/users" replace />} />
        <Route path="*" element={<Navigate to="/pm/assistant" replace />} />
      </Route>
    </Routes>
  )
}
