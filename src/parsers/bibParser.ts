import { v4 as uuidv4 } from 'uuid';
import { ParsedPaper } from '../types';

export const parseBib = (content: string): ParsedPaper[] => {
  const entries = content.split(/@\w+\s*\{/g).slice(1);
  const papers: ParsedPaper[] = [];

  for (const entry of entries) {
    const paper: Partial<ParsedPaper> = { id: uuidv4() };
    
    const extractField = (field: string) => {
      const regex = new RegExp(`${field}\\s*=\\s*[{"](.*?)[}"]`, 'i');
      const match = entry.match(regex);
      return match ? match[1].replace(/\\/g, '').trim() : undefined;
    };

    paper.title = extractField('title') || 'Untitled';
    paper.abstract = extractField('abstract');
    paper.keywords = extractField('keywords');
    paper.year = extractField('year');
    paper.authors = extractField('author');
    paper.journal = extractField('journal') || extractField('booktitle');

    papers.push(paper as ParsedPaper);
  }

  return papers;
};
