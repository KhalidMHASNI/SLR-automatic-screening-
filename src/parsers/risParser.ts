import { v4 as uuidv4 } from 'uuid';
import { ParsedPaper } from '../types';

export const parseRis = (content: string): ParsedPaper[] => {
  const entries = content.split(/ER\s*-/g).filter(e => e.trim().length > 0);
  const papers: ParsedPaper[] = [];

  for (const entry of entries) {
    const lines = entry.split('\n');
    const paper: Partial<ParsedPaper> = { id: uuidv4(), title: 'Untitled' };
    const authors: string[] = [];
    const keywords: string[] = [];

    for (const line of lines) {
      const match = line.match(/^([A-Z0-9]{2})\s*-\s*(.*)$/);
      if (!match) continue;

      const [, tag, value] = match;
      const val = value.trim();

      switch (tag) {
        case 'TI':
        case 'T1':
          paper.title = val;
          break;
        case 'AB':
          paper.abstract = val;
          break;
        case 'KW':
          keywords.push(val);
          break;
        case 'PY':
        case 'Y1':
          paper.year = val.substring(0, 4); // Extract year part
          break;
        case 'AU':
        case 'A1':
          authors.push(val);
          break;
        case 'JO':
        case 'T2':
          paper.journal = val;
          break;
      }
    }

    if (authors.length > 0) paper.authors = authors.join(' and ');
    if (keywords.length > 0) paper.keywords = keywords.join(', ');

    papers.push(paper as ParsedPaper);
  }

  return papers;
};
