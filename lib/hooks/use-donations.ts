import { useQuery } from "@tanstack/react-query";
import { PaginatedResponse, Activity } from "@/types";

export function useDonations(address: string | undefined, page: number = 1) {
  return useQuery<PaginatedResponse<Activity>>({
    queryKey: ["donations", address, page],
    queryFn: async () => {
      const response = await fetch(
        `/api/donations?address=${address}&page=${page}`
      );
      if (!response.ok) throw new Error("Failed to fetch donations");
      return response.json();
    },
    enabled: !!address,
    staleTime: 1000 * 60 * 2, // Data considered fresh for 2 minutes
    gcTime: 1000 * 60 * 15, // Cache data for 15 minutes
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });
}
