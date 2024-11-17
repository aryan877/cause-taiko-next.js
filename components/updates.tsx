"use client";

import { useAccount } from "wagmi";
import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Heart, Trash2, BadgeCheck } from "lucide-react";
import dayjs from "dayjs";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface Update {
  id: string;
  causeId: string;
  beneficiary: string;
  content: string;
  likesCount: number;
  timestamp: number;
}

interface UpdatesResponse {
  items: Update[];
  nextCursor: string | null;
}

export function Updates({
  causeId,
  beneficiary,
}: {
  causeId: string;
  beneficiary: string;
}) {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "likes">("recent");

  const isBeneficiary =
    address?.toLowerCase() === `0x${beneficiary.toLowerCase()}`;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery<UpdatesResponse>({
      queryKey: ["updates", causeId, sortBy],
      queryFn: async ({ pageParam }) => {
        const response = await fetch(
          `/api/causes/${causeId}/updates?cursor=${
            pageParam || ""
          }&sortBy=${sortBy}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch updates");
        }
        return response.json();
      },
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialPageParam: "",
    });

  const createUpdate = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/causes/${causeId}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          beneficiary: address,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to create update");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["updates", causeId] });
      setContent("");
      toast.success("Update posted successfully!");
    },
    onError: () => {
      toast.error("Failed to post update");
    },
  });

  const deleteUpdate = useMutation({
    mutationFn: async (updateId: string) => {
      const response = await fetch(
        `/api/causes/${causeId}/updates?updateId=${updateId}&beneficiary=${address}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        throw new Error("Failed to delete update");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["updates", causeId] });
      toast.success("Update deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete update");
    },
  });

  const likeUpdate = useMutation({
    mutationFn: async (updateId: string) => {
      const response = await fetch(`/api/causes/${causeId}/updates`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updateId,
          action: "like",
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to like update");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["updates", causeId] });
    },
    onError: () => {
      toast.error("Failed to like update");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createUpdate.mutate(content);
  };

  const updates = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold">Beneficiary Updates</h2>
        <Select
          value={sortBy}
          onValueChange={(value) => setSortBy(value as "recent" | "likes")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="likes">Most Liked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isBeneficiary && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Share an update about the cause..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!content.trim() || createUpdate.isPending}
            >
              {createUpdate.isPending ? "Posting..." : "Post Update"}
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-6">
        {updates.map((update) => (
          <UpdateItem
            key={update.id}
            update={update}
            onDelete={() => deleteUpdate.mutate(update.id)}
            onLike={() => likeUpdate.mutate(update.id)}
            currentUser={address}
            isBeneficiary={isBeneficiary}
          />
        ))}
      </div>

      {hasNextPage && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? "Loading more..." : "Load More Updates"}
        </Button>
      )}
    </div>
  );
}

function UpdateItem({
  update,
  onDelete,
  onLike,
  isBeneficiary,
}: {
  update: Update;
  onDelete: () => void;
  onLike: () => void;
  currentUser?: string;
  isBeneficiary: boolean;
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = () => {
    onDelete();
    setShowDeleteDialog(false);
  };

  return (
    <div className="space-y-4 bg-muted/30 rounded-lg p-6">
      <div className="flex items-start gap-4">
        <Avatar>
          <AvatarFallback>
            {update.beneficiary.slice(2, 4).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium flex items-center gap-1">
                Beneficiary
                <BadgeCheck className="h-4 w-4 text-primary" />
              </span>
              <span className="text-sm text-muted-foreground">
                {dayjs.unix(update.timestamp).fromNow()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="space-x-1"
                onClick={onLike}
              >
                <Heart className="h-4 w-4" />
                <span>{update.likesCount}</span>
              </Button>
              {isBeneficiary && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <p className="text-sm">{update.content}</p>
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Update</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this update? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
