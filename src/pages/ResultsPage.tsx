import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useScreeningStore } from '../store/useScreeningStore';
import { exportToCsv, exportToBib, generateCiteKey } from '../utils/export';
import { generatePrismaText } from '../utils/prisma';
import { PrismaDiagram } from '../components/PrismaDiagram';
import { Virtuoso } from 'react-virtuoso';
import { ScreenedPaper } from '../types';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  Search, Filter, Download, RotateCcw, Star, FileText, 
  ChevronDown, ChevronUp, BarChart2, ListFilter, X
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const ResultsPage = () => {
  const navigate = useNavigate();
  const store = useScreeningStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [decisionFilter, setDecisionFilter] = useState<Set<string>>(new Set(['INCLUDE', 'MAYBE', 'EXCLUDE', 'ERROR']));
  const [confidenceRange, setConfidenceRange] = useState<[number, number]>([0, 1]);
  const [sortBy, setSortBy] = useState<'similarity' | 'confidence' | 'year' | 'title'>('similarity');
  const [showStats, setShowStats] = useState(true);
  const [showPrisma, setShowPrisma] = useState(false);
  const [expandedPapers, setExpandedPapers] = useState<Set<string>>(new Set());
  const [confidenceThreshold, setConfidenceThreshold] = useState<number | null>(null);
  const [focusedPaperIndex, setFocusedPaperIndex] = useState<number>(0);
  const virtuosoRef = React.useRef<any>(null);

  const results = store.screeningResults;

  const reclassifiedResults = useMemo(() => {
    if (confidenceThreshold === null) return results;
    return results.map(p => {
      if (p.decision === 'MAYBE') {
        return {
          ...p,
          decision: (p.confidence >= confidenceThreshold ? 'INCLUDE' : 'EXCLUDE') as "INCLUDE" | "EXCLUDE",
          _reclassified: true
        };
      }
      return p;
    }) as ScreenedPaper[];
  }, [results, confidenceThreshold]);

  const filteredResults = useMemo(() => {
    return reclassifiedResults.filter(p => {
      const matchesSearch = 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.summary && p.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.abstract && p.abstract.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.authors && p.authors.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesDecision = decisionFilter.has(p.decision);
      const matchesConfidence = p.confidence >= confidenceRange[0] && p.confidence <= confidenceRange[1];
      
      return matchesSearch && matchesDecision && matchesConfidence;
    }).sort((a, b) => {
      if (sortBy === 'similarity') return b.similarity - a.similarity;
      if (sortBy === 'confidence') return b.confidence - a.confidence;
      if (sortBy === 'year') return (b.year || '0').localeCompare(a.year || '0');
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return 0;
    });
  }, [reclassifiedResults, searchQuery, decisionFilter, confidenceRange, sortBy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        setFocusedPaperIndex(prev => {
          const next = Math.min(prev + 1, filteredResults.length - 1);
          virtuosoRef.current?.scrollToIndex({ index: next, align: 'center' });
          return next;
        });
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        setFocusedPaperIndex(prev => {
          const next = Math.max(prev - 1, 0);
          virtuosoRef.current?.scrollToIndex({ index: next, align: 'center' });
          return next;
        });
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        const paper = filteredResults[focusedPaperIndex];
        if (paper) store.toggleStar(paper.id);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const paper = filteredResults[focusedPaperIndex];
        if (paper) navigate(`/paper/${paper.id}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredResults, focusedPaperIndex, navigate, store]);

  useEffect(() => {
    setFocusedPaperIndex(0);
  }, [searchQuery, decisionFilter, sortBy, confidenceThreshold]);

  const stats = useMemo(() => {
    const included = reclassifiedResults.filter(p => p.decision === 'INCLUDE').length;
    const maybe = reclassifiedResults.filter(p => p.decision === 'MAYBE').length;
    const excluded = reclassifiedResults.filter(p => p.decision === 'EXCLUDE').length;
    const reclassifiedCount = reclassifiedResults.filter(p => (p as any)._reclassified).length;
    const avgConfidence = reclassifiedResults.length ? reclassifiedResults.reduce((acc, p) => acc + p.confidence, 0) / reclassifiedResults.length : 0;
    
    // Confidence distribution
    const confDist = [0, 0, 0, 0, 0]; // 0-0.2, 0.2-0.4, 0.4-0.6, 0.6-0.8, 0.8-1.0
    reclassifiedResults.forEach(p => {
      const bucket = Math.min(Math.floor(p.confidence * 5), 4);
      confDist[bucket]++;
    });

    return {
      included, maybe, excluded, avgConfidence, reclassifiedCount,
      pieData: [
        { name: 'Include', value: included, color: '#22c55e' },
        { name: 'Maybe', value: maybe, color: '#f59e0b' },
        { name: 'Exclude', value: excluded, color: '#ef4444' }
      ],
      barData: confDist.map((count, i) => ({
        range: `${(i * 0.2).toFixed(1)}-${((i + 1) * 0.2).toFixed(1)}`,
        count
      }))
    };
  }, [reclassifiedResults]);

  const handleExportCsv = () => exportToCsv(reclassifiedResults);
  const handleExportBibInclude = () => exportToBib(reclassifiedResults.filter(p => p.decision === 'INCLUDE'), 'included.bib');
  const handleExportBibAll = () => exportToBib(reclassifiedResults.filter(p => p.decision !== 'EXCLUDE'), 'all-relevant.bib');
  const handleExportPrisma = () => {
    const text = generatePrismaText(store.parsedPapers.length, reclassifiedResults.length, reclassifiedResults);
    navigator.clipboard.writeText(text);
  };

  const toggleDecisionFilter = (decision: string) => {
    const newFilters = new Set(decisionFilter);
    if (newFilters.has(decision)) newFilters.delete(decision);
    else newFilters.add(decision);
    setDecisionFilter(newFilters);
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedPapers);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedPapers(newExpanded);
  };

  const keywordCloud = useMemo(() => {
    const keywords: Record<string, number> = {};
    reclassifiedResults.filter(p => p.decision === 'INCLUDE').forEach(p => {
      if (p.keywords) {
        p.keywords.split(',').forEach(kw => {
          const cleanKw = kw.trim().toLowerCase();
          if (cleanKw) {
            keywords[cleanKw] = (keywords[cleanKw] || 0) + 1;
          }
        });
      }
    });
    return Object.entries(keywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20); // Top 20 keywords
  }, [reclassifiedResults]);

  const coverageHeatmap = useMemo(() => {
    const data: Record<string, Record<string, number>> = {};
    const years = new Set<string>();
    const journals = new Set<string>();

    reclassifiedResults.filter(p => p.decision === 'INCLUDE').forEach(p => {
      if (p.year && p.journal) {
        const year = p.year;
        const journal = p.journal.substring(0, 20) + (p.journal.length > 20 ? '...' : ''); // truncate
        years.add(year);
        journals.add(journal);
        if (!data[journal]) data[journal] = {};
        data[journal][year] = (data[journal][year] || 0) + 1;
      }
    });

    const sortedYears = Array.from(years).sort();
    const sortedJournals = Array.from(journals).sort();

    return { sortedYears, sortedJournals, data };
  }, [reclassifiedResults]);

  const handleKeywordClick = (kw: string) => {
    setSearchQuery(kw);
  };

  const [gapAnalysis, setGapAnalysis] = useState<string | null>(null);
  const [isGeneratingGap, setIsGeneratingGap] = useState(false);

  const generateGapAnalysis = async () => {
    setIsGeneratingGap(true);
    try {
      const includedSummaries = reclassifiedResults
        .filter(p => p.decision === 'INCLUDE' && p.summary)
        .map(p => `- ${p.title}: ${p.summary}`)
        .join('\n');
      
      const prompt = `Given these papers:\n${includedSummaries}\n\nWhat gaps exist for this research: ${store.thesis}? Provide a concise paragraph.`;
      
      const res = await fetch('http://localhost:8080/api/screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          thesis: prompt, 
          title: 'Research Gap Analysis', 
          abstract: '', 
          model: store.selectedModel 
        }),
      });
      
      if (!res.ok) throw new Error('Failed to generate gap analysis');
      const data = await res.json();
      setGapAnalysis(data.reason || data.summary || 'Could not generate analysis.');
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsGeneratingGap(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Top Bar */}
      <div className="sticky top-14 z-40 border-b bg-white px-4 py-3 shadow-sm">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{results.length} papers screened</span>
            <span className="text-green-600">{stats.included} included</span>
            <span className="text-amber-600">{stats.maybe} maybe</span>
            <span className="text-red-600">{stats.excluded} excluded</span>
            <span>avg conf {(stats.avgConfidence * 100).toFixed(0)}%</span>
            <span>{Math.round(store.sessionMeta.durationMs / 1000)}s</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { store.resetSession(); navigate('/'); }}>
              <RotateCcw className="mr-2 h-4 w-4" /> New Session
            </Button>
            <div className="relative group">
              <Button variant="default" size="sm">
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
              <div className="absolute right-0 top-full mt-1 hidden w-48 flex-col rounded-md border bg-white shadow-lg group-hover:flex">
                <button onClick={handleExportCsv} className="px-4 py-2 text-left text-sm hover:bg-slate-100">Full Results (.csv)</button>
                <button onClick={handleExportBibInclude} className="px-4 py-2 text-left text-sm hover:bg-slate-100">Include Only (.bib)</button>
                <button onClick={handleExportBibAll} className="px-4 py-2 text-left text-sm hover:bg-slate-100">Include + Maybe (.bib)</button>
                <button onClick={handleExportPrisma} className="px-4 py-2 text-left text-sm hover:bg-slate-100">Copy PRISMA Text</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto flex flex-1 gap-6 p-4">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          
          {/* Stats Panel Toggle */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setShowStats(!showStats)} className="text-slate-500">
              <BarChart2 className="mr-2 h-4 w-4" />
              {showStats ? 'Hide Stats' : 'Show Stats'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowPrisma(!showPrisma)} className="text-slate-500">
              <ListFilter className="mr-2 h-4 w-4" />
              {showPrisma ? 'Hide PRISMA' : 'Show PRISMA'}
            </Button>
          </div>

          {/* Stats Panel */}
          <AnimatePresence>
            {showStats && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Decisions</CardTitle></CardHeader>
                    <CardContent className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={stats.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60}>
                            {stats.pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Confidence Distribution</CardTitle></CardHeader>
                    <CardContent className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.barData}>
                          <XAxis dataKey="range" fontSize={10} />
                          <YAxis fontSize={10} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Quick Metrics & Keywords</CardTitle></CardHeader>
                    <CardContent className="flex flex-col space-y-4 pt-4">
                      <div className="flex justify-between">
                        <div>
                          <div className="text-xs text-slate-500">Highest Confidence</div>
                          <div className="text-lg font-semibold">{(Math.max(...results.map(p => p.confidence)) * 100).toFixed(0)}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Avg Similarity</div>
                          <div className="text-lg font-semibold">{(results.reduce((acc, p) => acc + p.similarity, 0) / (results.length || 1) * 100).toFixed(0)}%</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-2">Top Keywords (Included)</div>
                        <div className="flex flex-wrap gap-1">
                          {keywordCloud.map(([kw, count]) => (
                            <Badge 
                              key={kw} 
                              variant="secondary" 
                              className="cursor-pointer text-[10px] px-1.5 py-0"
                              onClick={() => handleKeywordClick(kw)}
                            >
                              {kw} ({count})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="md:col-span-3">
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Coverage Heatmap (Included Papers)</CardTitle></CardHeader>
                    <CardContent className="overflow-x-auto">
                      {coverageHeatmap.sortedJournals.length > 0 ? (
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr>
                              <th className="p-1 font-medium text-slate-500 w-48">Journal</th>
                              {coverageHeatmap.sortedYears.map(year => (
                                <th key={year} className="p-1 font-medium text-slate-500 text-center">{year}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {coverageHeatmap.sortedJournals.map(journal => (
                              <tr key={journal} className="border-t border-slate-100">
                                <td className="p-1 truncate max-w-[12rem]" title={journal}>{journal}</td>
                                {coverageHeatmap.sortedYears.map(year => {
                                  const count = coverageHeatmap.data[journal]?.[year] || 0;
                                  return (
                                    <td key={year} className="p-1 text-center">
                                      {count > 0 ? (
                                        <div 
                                          className="mx-auto h-4 w-4 rounded-sm bg-indigo-500 flex items-center justify-center text-[8px] text-white font-bold"
                                          style={{ opacity: Math.max(0.2, Math.min(1, count / 3)) }}
                                          title={`${count} paper(s)`}
                                        >
                                          {count}
                                        </div>
                                      ) : (
                                        <div className="mx-auto h-4 w-4 rounded-sm bg-slate-100" />
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="text-sm text-slate-500 text-center py-4">Not enough data for heatmap</div>
                      )}
                    </CardContent>
                  </Card>
                  <Card className="md:col-span-3">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                      <CardTitle className="text-sm">Research Gap Detector</CardTitle>
                      <Button variant="outline" size="sm" onClick={generateGapAnalysis} disabled={isGeneratingGap}>
                        {isGeneratingGap ? 'Generating...' : gapAnalysis ? 'Regenerate' : 'Generate Analysis'}
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {gapAnalysis ? (
                        <p className="text-sm text-slate-700 italic">{gapAnalysis}</p>
                      ) : (
                        <p className="text-sm text-slate-500">Click generate to analyze included papers and find research gaps.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filters Bar */}
          <Card>
            <CardContent className="flex flex-wrap items-center gap-4 p-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input 
                  placeholder="Search title, reason, summary..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Badge 
                  variant={decisionFilter.has('INCLUDE') ? 'success' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleDecisionFilter('INCLUDE')}
                >INCLUDE</Badge>
                <Badge 
                  variant={decisionFilter.has('MAYBE') ? 'warning' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleDecisionFilter('MAYBE')}
                >MAYBE</Badge>
                <Badge 
                  variant={decisionFilter.has('EXCLUDE') ? 'destructive' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleDecisionFilter('EXCLUDE')}
                >EXCLUDE</Badge>
              </div>

              <select 
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="similarity">Sort by Similarity</option>
                <option value="confidence">Sort by Confidence</option>
                <option value="year">Sort by Year</option>
                <option value="title">Sort by Title</option>
              </select>

              <div className="flex items-center gap-2 border-l pl-4 ml-2">
                <span className="text-sm text-slate-500">MAYBE Threshold:</span>
                <input 
                  type="range" 
                  min="0" max="1" step="0.05" 
                  value={confidenceThreshold ?? 0.5} 
                  onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                  className="w-24 accent-indigo-600"
                />
                <span className="text-sm font-medium w-8">{(confidenceThreshold ?? 0.5).toFixed(2)}</span>
                {confidenceThreshold !== null && (
                  <Button variant="ghost" size="sm" onClick={() => setConfidenceThreshold(null)} className="h-6 px-2 text-xs">Reset</Button>
                )}
                {stats.reclassifiedCount > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">{stats.reclassifiedCount} reclassified</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Paper List */}
          <div className="space-y-4">
            {filteredResults.length > 0 ? (
              <Virtuoso
                ref={virtuosoRef}
                style={{ height: '800px' }}
                data={filteredResults}
                itemContent={(index, paper) => (
                  <div className="pb-4">
                    <Card key={paper.id} className={`overflow-hidden transition-shadow hover:shadow-md ${index === focusedPaperIndex ? 'ring-2 ring-indigo-500 shadow-md' : ''}`}>
                      <div className={`h-1 w-full ${
                        paper.decision === 'INCLUDE' ? 'bg-green-500' : 
                        paper.decision === 'MAYBE' ? 'bg-amber-500' : 
                        paper.decision === 'EXCLUDE' ? 'bg-red-500' : 'bg-slate-400'
                      }`} />
                      <CardContent className="p-5">
                        <div className="mb-3 flex items-start justify-between gap-4">
                          <div>
                            <Link to={`/paper/${paper.id}`} className="hover:underline">
                              <h3 className="text-lg font-semibold text-slate-900 leading-tight mb-1">{paper.title}</h3>
                            </Link>
                            <div className="text-sm text-slate-500">
                              {paper.authors && <span className="mr-3">{paper.authors}</span>}
                              {paper.journal && <span className="mr-3 italic">{paper.journal}</span>}
                              {paper.year && <span className="font-medium">{paper.year}</span>}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant={
                              paper.decision === 'INCLUDE' ? 'success' : 
                              paper.decision === 'MAYBE' ? 'warning' : 
                              paper.decision === 'EXCLUDE' ? 'destructive' : 'default'
                            }>
                              {paper.decision} ({(paper.confidence * 100).toFixed(0)}%)
                            </Badge>
                            <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                              {generateCiteKey(paper)}
                            </Badge>
                            <button 
                              onClick={() => store.toggleStar(paper.id)}
                              className={`rounded-full p-1 transition-colors hover:bg-slate-100 ${store.starred.has(paper.id) ? 'text-yellow-500' : 'text-slate-400'}`}
                            >
                              <Star className="h-5 w-5" fill={store.starred.has(paper.id) ? "currentColor" : "none"} />
                            </button>
                          </div>
                        </div>

                        <div className="mb-4 rounded-md bg-slate-50 p-3 text-sm text-slate-700 italic border border-slate-100">
                          <span className="font-semibold not-italic text-slate-900 mr-2">AI Reason:</span>
                          {paper.reason}
                        </div>

                        {expandedPapers.has(paper.id) && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="mb-4 space-y-4 text-sm"
                          >
                            {paper.summary && (
                              <div>
                                <h4 className="font-semibold text-slate-900 mb-1">AI Summary</h4>
                                <p className="text-slate-700">{paper.summary}</p>
                              </div>
                            )}
                            {paper.abstract && (
                              <div>
                                <h4 className="font-semibold text-slate-900 mb-1">Abstract</h4>
                                <p className="text-slate-700">{paper.abstract}</p>
                              </div>
                            )}
                            <div>
                              <h4 className="font-semibold text-slate-900 mb-1">Notes</h4>
                              <Input 
                                placeholder="Add a note..." 
                                value={store.notes[paper.id] || ''}
                                onChange={(e) => store.setNote(paper.id, e.target.value)}
                                className="h-8 text-sm"
                              />
                            </div>
                          </motion.div>
                        )}

                        <div className="flex items-center justify-between border-t pt-3">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="font-medium">Similarity:</span>
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                              <div 
                                className="h-full bg-indigo-500" 
                                style={{ width: `${paper.similarity * 100}%` }} 
                              />
                            </div>
                            <span>{(paper.similarity * 100).toFixed(0)}%</span>
                          </div>
                          
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => toggleExpand(paper.id)}
                            className="text-xs text-slate-500 hover:text-slate-900"
                          >
                            {expandedPapers.has(paper.id) ? (
                              <><ChevronUp className="mr-1 h-3 w-3" /> Show Less</>
                            ) : (
                              <><ChevronDown className="mr-1 h-3 w-3" /> Show More</>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <FileText className="mb-4 h-12 w-12 opacity-20" />
                <p>No papers match your current filters.</p>
              </div>
            )}
          </div>
        </div>

        {/* PRISMA Side Panel */}
        <AnimatePresence>
          {showPrisma && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="hidden lg:block"
            >
              <Card className="sticky top-20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm">PRISMA Flow</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setShowPrisma(false)} className="h-6 w-6">
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="text-sm p-2">
                  <PrismaDiagram
                    totalUploaded={store.parsedPapers.length}
                    duplicatesRemoved={0}
                    screened={store.screeningResults.length}
                    included={stats.included}
                    excluded={stats.excluded}
                    maybe={stats.maybe}
                    errors={0}
                  />
                  <Button variant="outline" className="mt-6 w-full" onClick={handleExportPrisma}>
                    Copy PRISMA Text
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
