import { useQuery } from "@tanstack/react-query";
import { PaginatedCauses, Cause } from "@/types";

export function useCauses(page: number, featured?: boolean) {
  return useQuery<PaginatedCauses>({
    queryKey: ["causes", page, featured],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        ...(featured ? { featured: "true" } : {}),
      });

      const response = await fetch(`/api/causes?${params}`);
      if (!response.ok) throw new Error("Failed to fetch causes");
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
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
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}
