import { useQuery } from '@tanstack/react-query';
import { fetchModels } from '../api/screeningApi';

export const useModels = () => {
  return useQuery({
    queryKey: ['models'],
    queryFn: fetchModels,
    staleTime: 60000,
  });
};
