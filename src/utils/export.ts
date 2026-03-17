import Papa from 'papaparse';
import { ScreenedPaper } from '../types';

export const exportToCsv = (papers: ScreenedPaper[]) => {
  const csv = Papa.unparse(papers.map(p => ({
    Title: p.title,
    Authors: p.authors || '',
    Year: p.year || '',
    Journal: p.journal || '',
    Abstract: p.abstract || '',
    Keywords: p.keywords || '',
    Decision: p.decision,
    Confidence: p.confidence,
    Similarity: p.similarity,
    Reason: p.reason,
    Summary: p.summary || ''
  })));
  
  downloadFile(csv, 'litscreen-results.csv', 'text/csv');
};

export const exportToBib = (papers: ScreenedPaper[], filename: string) => {
  const bib = papers.map(p => {
    const citeKey = generateCiteKey(p);
    return `@article{${citeKey},
  title={${p.title}},
  author={${p.authors || ''}},
  year={${p.year || ''}},
  journal={${p.journal || ''}},
  abstract={${p.abstract || ''}},
  keywords={${p.keywords || ''}},
  note={Decision: ${p.decision}, Confidence: ${p.confidence}}
}`;
  }).join('\n\n');
  
  downloadFile(bib, filename, 'text/plain');
};

export const generateCiteKey = (paper: ScreenedPaper | import('../types').ParsedPaper) => {
  const firstAuthor = paper.authors?.split(',')[0]?.split(' ')[0] || 'Unknown';
  const year = paper.year || 'ND';
  const firstWord = paper.title.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '') || 'Title';
  return `${firstAuthor}${year}${firstWord}`.toLowerCase();
};

const downloadFile = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
