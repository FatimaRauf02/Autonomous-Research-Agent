import React, { useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import SearchPage from './pages/SearchPage.jsx'
import GraphPage from './pages/GraphPage.jsx'
import QueryPage from './pages/QueryPage.jsx'
import JobsPage from './pages/JobsPage.jsx'
import ReportModal from './components/ReportModal.jsx'
import { useResearch } from './hooks/useResearch.js'
import { useToast, ToastContainer } from './components/Toast.jsx'

export default function App() {
  const [page, setPage] = useState('search')
  const [modalReport, setModalReport] = useState(null)
  const research = useResearch()
  const { toasts, dismiss } = useToast()

  const navigateTo = (newPage) => {
    if (newPage === 'search') {
      research.setActiveJob(null)
      research.setError(null)
    }
    setPage(newPage)
  }

  const openReport = async (jobId) => {
    try {
      const { getReport } = await import('./utils/api.js')
      const report = await getReport(jobId)
      setModalReport(report)
    } catch (e) {
      console.error('Failed to load report', e)
    }
  }

  const closeReport = () => setModalReport(null)

  React.useEffect(() => {
    if (research.report) setModalReport(research.report)
  }, [research.report])

  const pages = {
    search: <SearchPage research={research} onDone={() => {}} />,
    graph:  <GraphPage  research={research} />,
    query:  <QueryPage  research={research} />,
    jobs:   <JobsPage   research={research} onOpenReport={openReport} />,
  }

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#ffffff' }}>
      <Sidebar page={page} setPage={navigateTo} jobs={research.jobs} activeJob={research.activeJob} />
      <main style={{ flex:1, overflowY:'auto' }}>
        {pages[page] || pages.search}
      </main>
      {modalReport && <ReportModal report={modalReport} onClose={closeReport} />}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  )
}