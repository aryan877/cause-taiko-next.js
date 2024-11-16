"use client";

import { CauseDetails } from "@/components/cause-details";
import { useParams } from "next/navigation";
import { useCause } from "@/lib/hooks/use-causes";
import { Comments } from "@/components/comments";

export default function CausePage() {
  const params = useParams();
  const { data: cause, isLoading, error } = useCause(params.id as string);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">Loading...</div>
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
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-6 max-w-6xl mx-auto">
          Comments
        </h2>
        <Comments causeId={params.id as string} />
      </div>
    </div>
  );
}
