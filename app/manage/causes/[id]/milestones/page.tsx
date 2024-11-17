"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import { useWriteContract } from "wagmi";
import { contractConfig } from "@/lib/utils";
import { toast } from "sonner";
import { parseEther } from "viem";
import { useMilestones } from "@/lib/hooks/use-milestones";
import { useCause } from "@/lib/hooks/use-causes";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatEther } from "viem";
import { ArrowLeft, RefreshCw } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { waitForTransactionReceipt } from "@wagmi/core";
import { config } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";

dayjs.extend(relativeTime);

export default function CreateMilestonePage() {
  const params = useParams();
  const router = useRouter();
  const causeId = params.id as string;

  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");

  const { writeContract } = useWriteContract({
    mutation: {
      onMutate: () => {
        return toast.loading("Initiating milestone creation...");
      },
      onSuccess: async (hash, _, toastId) => {
        const explorerUrl = `https://hekla.taikoscan.io/tx/${hash}`;
        toast.loading(
          <div className="flex flex-col gap-2">
            <p>Waiting for confirmation...</p>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:text-blue-600 underline"
            >
              View on Explorer
            </a>
          </div>,
          { id: toastId }
        );

        try {
          await waitForTransactionReceipt(config, {
            hash,
            confirmations: 1,
          });

          toast.success(
            <div className="flex flex-col gap-2">
              <p>Milestone created successfully!</p>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:text-blue-600 underline"
              >
                View on Explorer
              </a>
            </div>,
            { id: toastId }
          );
          setDescription("");
          setTargetAmount("");

          await queryClient.invalidateQueries({
            queryKey: ["milestones", causeId],
          });
        } catch {
          toast.error("Failed to create milestone", { id: toastId });
        }
      },
      onError: (error, _, toastId) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to create milestone",
          { id: toastId }
        );
      },
    },
  });

  const { data: cause } = useCause(causeId);
  const { data: milestonesData, isLoading: loadingMilestones } =
    useMilestones(causeId);
  const milestones = milestonesData?.items || [];

  const queryClient = useQueryClient();

  const { isConnected } = useAccount();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description || !targetAmount) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      if (!writeContract) {
        toast.error("Wallet not connected");
        return;
      }

      await writeContract({
        ...contractConfig,
        functionName: "addMilestone",
        args: [`0x${causeId}`, description, parseEther(targetAmount)],
      });
    } catch (error) {
      console.error("Error adding milestone:", error);
      toast.error(
        error instanceof Error ? error.message : "Error adding milestone"
      );
    }
  };

  const handleRefresh = async () => {
    const toastId = toast.loading("Refreshing milestones...");
    try {
      await queryClient.invalidateQueries({
        queryKey: ["milestones", causeId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["cause", causeId],
      });
      toast.success("Data refreshed!", { id: toastId });
    } catch {
      toast.error("Failed to refresh data", { id: toastId });
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <Button
        variant="ghost"
        onClick={() => router.push("/manage/causes")}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Causes
      </Button>

      <div className="grid gap-6">
        {/* Cause Info */}
        <Card>
          <CardHeader>
            <CardTitle>Cause Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <p className="text-lg font-medium">{cause?.name}</p>
              </div>
              <div>
                <Label>Target Amount</Label>
                <p className="text-lg font-medium">
                  {cause
                    ? `${formatEther(BigInt(cause.targetAmount))} ETH`
                    : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create Milestone */}
        <Card>
          <CardHeader>
            <CardTitle>Add New Milestone</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter milestone description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAmount">Target Amount (ETH)</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="0.0"
                />
              </div>

              <Button type="submit" className="w-full" disabled={!isConnected}>
                {isConnected ? "Add Milestone" : "Wallet not connected"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Existing Milestones */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Existing Milestones</CardTitle>
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={loadingMilestones}
                size="sm"
                className="gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    loadingMilestones ? "animate-spin" : ""
                  }`}
                />
                Refresh List
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingMilestones ? (
              <div className="text-center py-4">Loading milestones...</div>
            ) : milestones.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No milestones created yet
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Target Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {milestones.map((milestone) => (
                    <TableRow key={milestone.id}>
                      <TableCell>{milestone.description}</TableCell>
                      <TableCell>
                        {formatEther(BigInt(milestone.targetAmount))} ETH
                      </TableCell>
                      <TableCell>
                        {milestone.isCompleted ? (
                          <span className="text-green-600">Completed</span>
                        ) : (
                          <span className="text-yellow-600">In Progress</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {dayjs(milestone.createdAt * 1000).fromNow()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
