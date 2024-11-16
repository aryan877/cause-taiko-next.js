import { useQuery } from "@tanstack/react-query";
import { Milestone } from "@/types";

interface MilestonesResponse {
  items: Milestone[];
}

export function useMilestones(causeId: string) {
  return useQuery<MilestonesResponse>({
    queryKey: ["milestones", causeId],
    queryFn: async () => {
      const response = await fetch(`/api/causes/${causeId}/milestones`);
      if (!response.ok) throw new Error("Failed to fetch milestones");
      return response.json();
    },
    enabled: !!causeId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}
