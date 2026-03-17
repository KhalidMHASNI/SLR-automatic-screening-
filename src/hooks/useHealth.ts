import { useQuery } from '@tanstack/react-query';
import { fetchHealth } from '../api/screeningApi';

export const useHealth = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: 10000, // Poll every 10s
    retry: false,
  });
};
