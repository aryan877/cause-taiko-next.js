import { useQuery } from "@tanstack/react-query";
import { PaginatedCauses, Cause } from "@/types";

export function useCauses(page: number = 1, limit: number = 9) {
  return useQuery<PaginatedCauses>({
    queryKey: ["causes", page, limit],
    queryFn: async () => {
      const response = await fetch(`/api/causes?page=${page}&limit=${limit}`);
      if (!response.ok) throw new Error("Failed to fetch causes");
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // Data considered fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // Cache data for 30 minutes
  });
}

export function useCause(id: string) {
  return useQuery<Cause>({
    queryKey: ["cause", id],
    queryFn: async () => {
      const response = await fetch(`/api/causes/${id}`);
      if (!response.ok) throw new Error("Failed to fetch cause");
      return response.json();
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // Data considered fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // Cache data for 30 minutes
  });
}
