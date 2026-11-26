import { useState } from 'react';
import { ReportProvider } from './context/ReportContext';
import { useSplash } from './hooks/useSplash';
import AppShell from './components/layout/AppShell';
import SplashPage from './pages/SplashPage';
import HomePage from './pages/HomePage';
import ReportFormPage from './pages/ReportFormPage';
import TrackingPage from './pages/TrackingPage';

function MainContent() {
  const showSplash = useSplash(1500);
  const [tab, setTab] = useState('home');

  if (showSplash) return <SplashPage />;

  return (
    <AppShell activeTab={tab} onChangeTab={setTab}>
      {tab === 'home' && <HomePage onNavigate={setTab} />}
      {tab === 'lapor' && <ReportFormPage onSuccess={() => setTab('home')} />}
      {tab === 'lacak' && <TrackingPage />}
    </AppShell>
  );
}

export default function App() {
  return (
    <ReportProvider>
      <MainContent />
    </ReportProvider>
  );
}