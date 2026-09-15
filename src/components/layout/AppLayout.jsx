import { Outlet } from 'react-router-dom'
import AnalysisModal from '../drawers/AnalysisModal.jsx'
import ProfileDrawer from '../drawers/ProfileDrawer.jsx'
import Header from './Header.jsx'
import Sidebar from './Sidebar.jsx'
import styles from './AppLayout.module.css'

export default function AppLayout() {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <Header />
        <Outlet />
      </div>
      <ProfileDrawer />
      <AnalysisModal />
    </div>
  )
}
