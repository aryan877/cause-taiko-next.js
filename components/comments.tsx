"use client";

import { useAccount } from "wagmi";
import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Heart } from "lucide-react";
import dayjs from "dayjs";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { CommentsResponse, Comment } from "@/types";

export function Comments({ causeId }: { causeId: string }) {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [content, setContent] = useState("");

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery<CommentsResponse>({
      queryKey: ["comments", causeId],
      queryFn: async ({ pageParam }) => {
        const response = await fetch(
          `/api/causes/${causeId}/comments?cursor=${pageParam || ""}`
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createComment.mutate({ content, parentId: replyTo || undefined });
  };

  const comments = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
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
}: {
  comment: Comment;
  onReply: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex space-x-4">
        <Avatar>
          <AvatarFallback>
            {comment.author.slice(2, 4).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-medium">
                {comment.author.slice(0, 6)}...{comment.author.slice(-4)}
              </span>
              <span className="text-sm text-gray-500">
                {dayjs.unix(comment.timestamp).fromNow()}
              </span>
            </div>
            <Button variant="ghost" size="sm" className="space-x-1">
              <Heart className="h-4 w-4" />
              <span>{comment.likesCount}</span>
            </Button>
          </div>
          <p className="text-sm">{comment.content}</p>
          <Button variant="ghost" size="sm" onClick={onReply}>
            Reply
          </Button>
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-12 space-y-4">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="flex space-x-4">
              <Avatar>
                <AvatarFallback>
                  {reply.author.slice(2, 4).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">
                      {reply.author.slice(0, 6)}...{reply.author.slice(-4)}
                    </span>
                    <span className="text-sm text-gray-500">
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
