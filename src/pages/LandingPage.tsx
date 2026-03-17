import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { FileText, UploadCloud, Play, CheckCircle2, AlertCircle, Loader2, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

import { useScreeningStore } from '../store/useScreeningStore';
import { useHealth } from '../hooks/useHealth';
import { useModels } from '../hooks/useModels';
import { parseFileContent } from '../parsers/parserUtils';
import { findDuplicates } from '../utils/similarity';
import { ParsedPaper } from '../types';

import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';

export const LandingPage = () => {
  const navigate = useNavigate();
  const store = useScreeningStore();
  const { data: health, isLoading: isHealthLoading, isError: isHealthError } = useHealth();
  const { data: modelsData, isLoading: isModelsLoading } = useModels();
  
  const [isParsing, setIsParsing] = useState(false);
  const [duplicates, setDuplicates] = useState<Array<[ParsedPaper, ParsedPaper]>>([]);
  const [showDuplicates, setShowDuplicates] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    
    setIsParsing(true);
    try {
      const parsed = await parseFileContent(file);
      store.setParsedPapers(parsed);
      const dups = findDuplicates(parsed);
      setDuplicates(dups);
      toast.success(`Successfully parsed ${parsed.length} papers`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to parse file');
    } finally {
      setIsParsing(false);
    }
  }, [store]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.bib', '.ris'],
      'application/x-research-info-systems': ['.ris'],
      'application/x-bibtex': ['.bib']
    },
    maxFiles: 1
  });

  const handleStart = () => {
    if (!store.thesis.trim()) {
      toast.error('Please enter your thesis or research question.');
      return;
    }
    if (store.parsedPapers.length === 0) {
      toast.error('Please upload a .bib or .ris file first.');
      return;
    }
    if (!store.selectedModel && modelsData?.activeModel) {
      store.setSelectedModel(modelsData.activeModel);
    }
    navigate('/screening');
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-indigo-200/40 blur-3xl"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, -5, 0],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[40%] -right-[10%] w-[60%] h-[60%] rounded-full bg-blue-200/40 blur-3xl"
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 container mx-auto max-w-4xl px-4 py-12"
      >
        <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          LitScreen
        </h1>
        <p className="text-lg text-slate-600">
          AI-assisted literature screening for your PhD
        </p>
        
        <div className="mt-6 flex items-center justify-center gap-4">
          <div className="flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-sm shadow-sm">
            {isHealthLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            ) : isHealthError || !health?.ollama ? (
              <>
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-slate-600">Ollama Offline</span>
              </>
            ) : (
              <>
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                <span className="text-slate-600">Ollama Online ({health.ollamaLatencyMs}ms)</span>
              </>
            )}
          </div>
          
          <select 
            className="rounded-full border bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={store.selectedModel || modelsData?.activeModel || ''}
            onChange={(e) => store.setSelectedModel(e.target.value)}
            disabled={isModelsLoading || !modelsData}
          >
            <option value="" disabled>Select Model</option>
            {modelsData?.models.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="shadow-md">
          <CardContent className="p-6">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-slate-800">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">1</span>
              Research Question
            </h2>
            <Textarea
              placeholder="e.g., What are the applications of Large Language Models in systematic literature reviews, specifically focusing on screening automation?"
              className="min-h-[200px] resize-none text-base"
              value={store.thesis}
              onChange={(e) => store.setThesis(e.target.value)}
              maxLength={1000}
            />
            <div className="mt-2 text-right text-xs text-slate-500">
              {store.thesis.length} / 1000
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardContent className="p-6">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-slate-800">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">2</span>
              Upload Papers
            </h2>
            
            <div 
              {...getRootProps()} 
              className={`flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
              }`}
            >
              <input {...getInputProps()} />
              {isParsing ? (
                <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
              ) : (
                <>
                  <UploadCloud className="mb-4 h-10 w-10 text-slate-400" />
                  <p className="mb-2 text-sm font-medium text-slate-700">
                    Drag & drop your .bib or .ris file here
                  </p>
                  <p className="text-xs text-slate-500">
                    or click to select file
                  </p>
                </>
              )}
            </div>

            {store.parsedPapers.length > 0 && (
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex items-center justify-between rounded-lg bg-green-50 p-3 text-green-800 border border-green-200">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    <span className="font-medium">{store.parsedPapers.length} papers detected</span>
                  </div>
                </div>
                {duplicates.length > 0 && (
                  <div className="flex items-center justify-between rounded-lg bg-amber-50 p-3 text-amber-800 border border-amber-200">
                    <div className="flex items-center gap-2">
                      <Copy className="h-5 w-5" />
                      <span className="font-medium">{duplicates.length} potential duplicates</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowDuplicates(true)} className="h-8 bg-white">
                      Review
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 flex justify-center">
        <Button 
          size="lg" 
          className="h-14 gap-2 rounded-full px-8 text-lg shadow-lg transition-transform hover:scale-105"
          onClick={handleStart}
          disabled={!store.thesis.trim() || store.parsedPapers.length === 0 || isHealthError}
        >
          <Play className="h-5 w-5 fill-current" />
          Start Screening
        </Button>
      </div>

      {showDuplicates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex max-h-[80vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="text-lg font-semibold">Review Duplicates</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowDuplicates(false)}>Close</Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {duplicates.map(([p1, p2], idx) => (
                <div key={idx} className="mb-4 rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500">Pair {idx + 1}</span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded bg-slate-50 p-3">
                      <div className="mb-1 font-medium text-slate-900">{p1.title}</div>
                      <div className="text-xs text-slate-500">{p1.authors} • {p1.year}</div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2 w-full"
                        onClick={() => {
                          store.togglePaperSelection(p1.id);
                        }}
                      >
                        {store.selectedPaperIds.has(p1.id) ? 'Deselect' : 'Select'}
                      </Button>
                    </div>
                    <div className="rounded bg-slate-50 p-3">
                      <div className="mb-1 font-medium text-slate-900">{p2.title}</div>
                      <div className="text-xs text-slate-500">{p2.authors} • {p2.year}</div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2 w-full"
                        onClick={() => {
                          store.togglePaperSelection(p2.id);
                        }}
                      >
                        {store.selectedPaperIds.has(p2.id) ? 'Deselect' : 'Select'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
      </motion.div>
    </div>
  );
};
