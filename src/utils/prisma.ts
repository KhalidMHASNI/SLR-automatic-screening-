import { ScreenedPaper } from '../types';

export const generatePrismaText = (
  totalParsed: number,
  totalScreened: number,
  results: ScreenedPaper[]
) => {
  const included = results.filter(p => p.decision === 'INCLUDE').length;
  const maybe = results.filter(p => p.decision === 'MAYBE').length;
  const excluded = results.filter(p => p.decision === 'EXCLUDE').length;
  const removedBefore = totalParsed - totalScreened;

  return `PRISMA 2020 Flow Diagram Data:
---------------------------------
Identification:
- Records identified from databases/registers: ${totalParsed}
- Records removed before screening: ${removedBefore}

Screening:
- Records screened: ${totalScreened}
- Records excluded (AI-assisted): ${excluded}
- Reports sought for retrieval: ${included + maybe}
- Reports not retrieved: 0

Included:
- Studies included in review: ${included}
- Studies awaiting classification (Maybe): ${maybe}
`;
};
