// Levenshtein distance implementation
export const levenshteinDistance = (a: string, b: string): number => {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i += 1) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= b.length; j += 1) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= b.length; j += 1) {
    for (let i = 1; i <= a.length; i += 1) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[b.length][a.length];
};

export const findDuplicates = (papers: import('../types').ParsedPaper[]) => {
  const duplicates: Array<[import('../types').ParsedPaper, import('../types').ParsedPaper]> = [];
  
  for (let i = 0; i < papers.length; i++) {
    for (let j = i + 1; j < papers.length; j++) {
      const p1 = papers[i];
      const p2 = papers[j];
      const distance = levenshteinDistance(p1.title.toLowerCase(), p2.title.toLowerCase());
      const threshold = Math.min(p1.title.length, p2.title.length) * 0.1;
      
      if (distance <= threshold) {
        duplicates.push([p1, p2]);
      }
    }
  }
  
  return duplicates;
};
