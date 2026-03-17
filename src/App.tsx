import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { Navbar } from './components/layout/Navbar';
import { LandingPage } from './pages/LandingPage';
import { ScreeningPage } from './pages/ScreeningPage';
import { ResultsPage } from './pages/ResultsPage';
import { PaperDetailPage } from './pages/PaperDetailPage';
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/screening" element={<ScreeningPage />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="/paper/:id" element={<PaperDetailPage />} />
            </Routes>
          </main>
        </div>
        <KeyboardShortcutsHelp />
        <Toaster position="bottom-right" />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
