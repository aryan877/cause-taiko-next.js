"use client";

import { CauseDetails } from "@/components/cause-details";
import { useParams } from "next/navigation";
import { useCause } from "@/lib/hooks/use-causes";
import { Comments } from "@/components/comments";
import { Updates } from "@/components/updates";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";

export default function CausePage() {
  const params = useParams();
  const { data: cause, isLoading, error } = useCause(params.id as string);

  // Fetch counts
  const { data: counts } = useQuery({
    queryKey: ["counts", params.id],
    queryFn: async () => {
      const response = await fetch(`/api/causes/${params.id}/counts`);
      if (!response.ok) throw new Error("Failed to fetch counts");
      return response.json();
    },
    enabled: !!params.id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-16 text-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">
            Loading cause details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !cause) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-red-500">
        Failed to load cause
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <CauseDetails cause={cause} />
      <div className="my-8 max-w-6xl mx-auto">
        <Tabs defaultValue="comments" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="comments" className="flex-1">
              Comments {counts?.comments ? `(${counts.comments})` : ""}
            </TabsTrigger>
            <TabsTrigger value="updates" className="flex-1">
              Beneficiary Updates {counts?.updates ? `(${counts.updates})` : ""}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="comments" className="mt-6">
            <Comments causeId={params.id as string} />
          </TabsContent>
          <TabsContent value="updates" className="mt-6">
            <Updates
              causeId={params.id as string}
              beneficiary={cause.beneficiary}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
