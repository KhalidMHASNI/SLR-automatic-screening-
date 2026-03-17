import { parseBib } from './bibParser';
import { parseRis } from './risParser';
import { ParsedPaper } from '../types';

export const parseFileContent = async (file: File): Promise<ParsedPaper[]> => {
  const text = await file.text();
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'bib') {
    return parseBib(text);
  } else if (extension === 'ris') {
    return parseRis(text);
  } else {
    throw new Error('Unsupported file format. Please upload .bib or .ris files.');
  }
};
