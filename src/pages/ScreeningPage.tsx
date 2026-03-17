import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, AlertCircle, HelpCircle, XCircle, PauseCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

import { useScreeningStore } from '../store/useScreeningStore';
import { useScreening } from '../hooks/useScreening';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Card, CardContent } from '../components/ui/card';

export const ScreeningPage = () => {
  const navigate = useNavigate();
  const store = useScreeningStore();
  const { runScreening, isPaused, resumeCountdown } = useScreening();
  
  const [etaMs, setEtaMs] = useState<number | null>(null);

  useEffect(() => {
    if (store.screeningStatus === 'idle') {
      runScreening();
    }
  }, [store.screeningStatus, runScreening]);

  useEffect(() => {
    if (store.screeningStatus === 'done') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      const timer = setTimeout(() => navigate('/results'), 2000);
      return () => clearTimeout(timer);
    }
  }, [store.screeningStatus, navigate]);

  useEffect(() => {
    if (store.progress.done > 0 && store.sessionMeta.startedAt) {
      const elapsed = Date.now() - new Date(store.sessionMeta.startedAt).getTime();
      const avgTimePerPaper = elapsed / store.progress.done;
      const remaining = store.progress.total - store.progress.done;
      setEtaMs(avgTimePerPaper * remaining);
    }
  }, [store.progress, store.sessionMeta.startedAt]);

  const handleAbort = () => {
    store.abortScreening();
    navigate('/results');
  };

  const formatEta = (ms: number) => {
    if (ms < 1000) return '< 1s';
    const s = Math.floor((ms / 1000) % 60);
    const m = Math.floor((ms / (1000 * 60)) % 60);
    const h = Math.floor((ms / (1000 * 60 * 60)));
    return `${h > 0 ? `${h}h ` : ''}${m > 0 ? `${m}m ` : ''}${s}s`;
  };

  const included = store.screeningResults.filter(p => p.decision === 'INCLUDE').length;
  const maybe = store.screeningResults.filter(p => p.decision === 'MAYBE').length;
  const excluded = store.screeningResults.filter(p => p.decision === 'EXCLUDE').length;
  const errors = store.screeningResults.filter(p => p.decision === 'ERROR').length;

  const percentComplete = store.progress.total > 0 ? (store.progress.done / store.progress.total) * 100 : 0;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-slate-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-3xl"
      >
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-slate-900">
            {store.screeningStatus === 'done' ? 'Screening Complete!' : 'Screening in Progress'}
          </h1>
          <p className="text-slate-600">
            {store.screeningStatus === 'done' 
              ? 'Redirecting to results...' 
              : `Screened ${store.progress.done} of ${store.progress.total} papers`}
          </p>
        </div>

        <Card className="mb-8 overflow-hidden shadow-lg">
          <CardContent className="p-8">
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between text-sm font-medium text-slate-700">
                <span>Progress</span>
                <span>{Math.round(percentComplete)}%</span>
              </div>
              <Progress value={percentComplete} className="h-3" indicatorColor="bg-indigo-600" />
            </div>

            {isPaused ? (
              <div className="flex items-center justify-center gap-2 text-amber-600">
                <PauseCircle className="h-5 w-5 animate-pulse" />
                <span>Rate limited. Resuming in {resumeCountdown}s...</span>
              </div>
            ) : store.screeningStatus === 'running' ? (
              <div className="flex items-center justify-between text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                  <span className="italic">Processing batch...</span>
                </div>
                {etaMs !== null && (
                  <span>ETA: {formatEta(etaMs)}</span>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <CheckCircle2 className="mb-2 h-8 w-8 text-green-600" />
              <div className="text-3xl font-bold text-green-700">{included}</div>
              <div className="text-xs font-medium uppercase tracking-wider text-green-600">Include</div>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <HelpCircle className="mb-2 h-8 w-8 text-amber-600" />
              <div className="text-3xl font-bold text-amber-700">{maybe}</div>
              <div className="text-xs font-medium uppercase tracking-wider text-amber-600">Maybe</div>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <XCircle className="mb-2 h-8 w-8 text-red-600" />
              <div className="text-3xl font-bold text-red-700">{excluded}</div>
              <div className="text-xs font-medium uppercase tracking-wider text-red-600">Exclude</div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-slate-100">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <AlertCircle className="mb-2 h-8 w-8 text-slate-500" />
              <div className="text-3xl font-bold text-slate-700">{errors}</div>
              <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Errors</div>
            </CardContent>
          </Card>
        </div>

        {store.screeningStatus === 'running' && (
          <div className="flex justify-center">
            <Button variant="destructive" onClick={handleAbort}>
              Abort Screening
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
