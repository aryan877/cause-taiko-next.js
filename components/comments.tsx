"use client";

import { useAccount } from "wagmi";
import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Heart, Trash2 } from "lucide-react";
import dayjs from "dayjs";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { CommentsResponse, Comment } from "@/types";
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

export function Comments({ causeId }: { causeId: string }) {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "likes">("recent");

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery<CommentsResponse>({
      queryKey: ["comments", causeId, sortBy],
      queryFn: async ({ pageParam }) => {
        const response = await fetch(
          `/api/causes/${causeId}/comments?cursor=${
            pageParam || ""
          }&sortBy=${sortBy}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch comments");
        }
        return response.json();
      },
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialPageParam: "",
    });

  const createComment = useMutation({
    mutationFn: async ({
      content,
      parentId,
    }: {
      content: string;
      parentId?: string;
    }) => {
      const response = await fetch(`/api/causes/${causeId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          author: address,
          parentId,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to create comment");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", causeId] });
      setContent("");
      setReplyTo(null);
      toast.success("Comment posted successfully!");
    },
    onError: () => {
      toast.error("Failed to post comment");
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const response = await fetch(
        `/api/causes/${causeId}/comments?commentId=${commentId}&author=${address}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        throw new Error("Failed to delete comment");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", causeId] });
      toast.success("Comment deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete comment");
    },
  });

  const likeComment = useMutation({
    mutationFn: async (commentId: string) => {
      const response = await fetch(`/api/causes/${causeId}/comments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentId,
          action: "like",
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to like comment");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", causeId] });
    },
    onError: () => {
      toast.error("Failed to like comment");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createComment.mutate({ content, parentId: replyTo || undefined });
  };

  const comments = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold">Comments</h2>
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          placeholder="Write a comment..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={!address}
        />
        <div className="flex justify-end space-x-2">
          {replyTo && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setReplyTo(null)}
            >
              Cancel Reply
            </Button>
          )}
          <Button
            type="submit"
            disabled={!address || !content.trim() || createComment.isPending}
          >
            {createComment.isPending ? "Posting..." : "Post Comment"}
          </Button>
        </div>
      </form>

      <div className="space-y-4">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onReply={() => setReplyTo(comment.id)}
            onDelete={() => deleteComment.mutate(comment.id)}
            onLike={() => likeComment.mutate(comment.id)}
            currentUser={address}
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
          {isFetchingNextPage ? "Loading more..." : "Load More Comments"}
        </Button>
      )}
    </div>
  );
}

function CommentItem({
  comment,
  onReply,
  onDelete,
  onLike,
  currentUser,
}: {
  comment: Comment;
  onReply: () => void;
  onDelete: () => void;
  onLike: () => void;
  currentUser?: string;
}) {
  const isAuthor =
    currentUser?.toLowerCase() === `0x${comment.author.toLowerCase()}`;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = () => {
    onDelete();
    setShowDeleteDialog(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
          <AvatarFallback>
            {comment.author.slice(2, 4).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-sm sm:text-base">
                {comment.author.slice(0, 6)}...{comment.author.slice(-4)}
              </span>
              <span className="text-xs sm:text-sm text-gray-500">
                {dayjs.unix(comment.timestamp).fromNow()}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="space-x-1"
                onClick={onLike}
              >
                <Heart className="h-4 w-4" />
                <span>{comment.likesCount}</span>
              </Button>
              {isAuthor && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <p className="text-sm">{comment.content}</p>
          <Button variant="ghost" size="sm" onClick={onReply}>
            Reply
          </Button>
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Comment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this comment? This action cannot
              be undone.
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

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-4 sm:ml-12 space-y-4">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="flex flex-col sm:flex-row gap-4">
              <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                <AvatarFallback>
                  {reply.author.slice(2, 4).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm sm:text-base">
                      {reply.author.slice(0, 6)}...{reply.author.slice(-4)}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-500">
                      {dayjs.unix(reply.timestamp).fromNow()}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" className="space-x-1">
                    <Heart className="h-4 w-4" />
                    <span>{reply.likesCount}</span>
                  </Button>
                </div>
                <p className="text-sm">{reply.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
