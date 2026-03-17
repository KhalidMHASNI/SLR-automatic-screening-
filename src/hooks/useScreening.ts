import { useState, useCallback } from 'react';
import { useScreeningStore } from '../store/useScreeningStore';
import { screenBatch } from '../api/screeningApi';
import { ParsedPaper, ScreenedPaper } from '../types';
import toast from 'react-hot-toast';

const CHUNK_SIZE = 50;
const MAX_RETRIES = 2;

export const useScreening = () => {
  const store = useScreeningStore();
  const [isPaused, setIsPaused] = useState(false);
  const [resumeCountdown, setResumeCountdown] = useState(0);

  const runScreening = useCallback(async () => {
    const { thesis, parsedPapers, selectedPaperIds, selectedModel } = useScreeningStore.getState();
    const papersToScreen = parsedPapers.filter(p => selectedPaperIds.has(p.id));
    
    store.startScreening();
    const startTime = Date.now();
    let doneCount = 0;

    for (let i = 0; i < papersToScreen.length; i += CHUNK_SIZE) {
      if (useScreeningStore.getState().screeningStatus === 'aborted') break;

      const chunk = papersToScreen.slice(i, i + CHUNK_SIZE).map(p => ({ ...p, model: selectedModel }));
      let retries = 0;
      let success = false;

      while (!success && retries <= MAX_RETRIES) {
        if (useScreeningStore.getState().screeningStatus === 'aborted') break;

        try {
          const res = await screenBatch({ thesis, papers: chunk });
          
          const screenedChunk: ScreenedPaper[] = chunk.map((p, idx) => ({
            ...p,
            decision: res.results[idx]?.decision || 'ERROR',
            confidence: res.results[idx]?.confidence || 0,
            similarity: res.results[idx]?.similarity || 0,
            reason: res.results[idx]?.reason || 'Failed to process',
            summary: res.results[idx]?.summary || null
          }));

          store.addScreeningResults(screenedChunk);
          doneCount += chunk.length;
          store.updateProgress(doneCount, papersToScreen.length);
          success = true;
        } catch (error: any) {
          if (error.message.includes('Rate limited')) {
            setIsPaused(true);
            const match = error.message.match(/(\d+)s/);
            const waitTime = match ? parseInt(match[1], 10) : 60;
            setResumeCountdown(waitTime);
            
            await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
            setIsPaused(false);
            setResumeCountdown(0);
          } else {
            retries++;
            if (retries > MAX_RETRIES) {
              toast.error(`Batch failed after ${MAX_RETRIES} retries.`);
              const errorChunk: ScreenedPaper[] = chunk.map(p => ({
                ...p,
                decision: 'ERROR',
                confidence: 0,
                similarity: 0,
                reason: 'Batch processing failed',
                summary: null
              }));
              store.addScreeningResults(errorChunk);
              doneCount += chunk.length;
              store.updateProgress(doneCount, papersToScreen.length);
              break;
            }
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
          }
        }
      }
    }

    if (useScreeningStore.getState().screeningStatus !== 'aborted') {
      store.finishScreening(Date.now() - startTime);
    }
  }, [store]);

  return { runScreening, isPaused, resumeCountdown };
};
