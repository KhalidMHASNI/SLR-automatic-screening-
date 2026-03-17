import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useScreeningStore } from '../store/useScreeningStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, Star, Quote } from 'lucide-react';
import { generateCiteKey } from '../utils/export';

export const PaperDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const store = useScreeningStore();

  const paper = store.screeningResults.find(p => p.id === id);
  const originalPaper = store.parsedPapers.find(p => p.id === id);

  if (!paper) {
    return (
      <div className="flex-1 p-8 text-center">
        <h2 className="text-2xl font-bold text-slate-900">Paper not found</h2>
        <Button className="mt-4" onClick={() => navigate('/results')}>Back to Results</Button>
      </div>
    );
  }

  const isStarred = store.selectedPaperIds.has(paper.id);
  const citeKey = generateCiteKey(paper);

  return (
    <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
      <Button variant="ghost" className="mb-6 -ml-4 text-slate-500" onClick={() => navigate('/results')}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Results
      </Button>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
                {paper.title}
              </h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => store.togglePaperSelection(paper.id)}
                className={isStarred ? 'text-yellow-500' : 'text-slate-400'}
              >
                <Star className="h-6 w-6" fill={isStarred ? 'currentColor' : 'none'} />
              </Button>
            </div>
            <p className="text-slate-600 mt-2 text-lg">{paper.authors}</p>
            <div className="flex flex-wrap items-center gap-3 mt-4 text-sm text-slate-500">
              {paper.year && <span>{paper.year}</span>}
              {paper.journal && <span>• {paper.journal}</span>}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold
              ${paper.decision === 'INCLUDE' ? 'bg-green-100 text-green-800' : 
                paper.decision === 'MAYBE' ? 'bg-amber-100 text-amber-800' : 
                'bg-red-100 text-red-800'}`}
            >
              {paper.decision}
            </span>
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
              Confidence: {Math.round(paper.confidence * 100)}%
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800 font-mono">
              Cite Key: {citeKey}
            </span>
          </div>

          <Card className="bg-indigo-50/50 border-indigo-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-indigo-900 flex items-center">
                <Quote className="mr-2 h-4 w-4" /> AI Reasoning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 leading-relaxed">{paper.reason}</p>
            </CardContent>
          </Card>

          {paper.summary && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">AI Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 leading-relaxed">{paper.summary}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Abstract</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                {paper.abstract || 'No abstract available.'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-80 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <span className="block text-slate-500 mb-1">Keywords</span>
                <div className="flex flex-wrap gap-1">
                  {originalPaper?.keywords ? (
                    originalPaper.keywords.split(',').map(kw => (
                      <span key={kw.trim()} className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {kw.trim()}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic">None</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
};
