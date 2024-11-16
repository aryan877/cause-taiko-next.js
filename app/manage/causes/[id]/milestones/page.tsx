"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
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
import { ArrowLeft } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function CreateMilestonePage() {
  const params = useParams();
  const router = useRouter();
  const causeId = params.id as string;

  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
  });

  const { data: cause } = useCause(causeId);
  const { data: milestonesData, isLoading: loadingMilestones } =
    useMilestones(causeId);
  const milestones = milestonesData?.items || [];

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

      toast.success("Milestone added successfully!");
      setDescription("");
      setTargetAmount("");
    } catch (error) {
      console.error("Error adding milestone:", error);
      const message =
        error instanceof Error ? error.message : "Error adding milestone";
      toast.error(message);
    }
  };

  const isLoading = isPending || isConfirming;

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

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !writeContract}
              >
                {isLoading ? "Adding Milestone..." : "Add Milestone"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Existing Milestones */}
        <Card>
          <CardHeader>
            <CardTitle>Existing Milestones</CardTitle>
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
