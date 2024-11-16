"use client";

import { formatEther } from "viem";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { DonateCauseDialog } from "./donate-dialog";
import { CauseDetailsProps } from "@/types";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import ReactMarkdown from "react-markdown";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { contractConfig } from "@/lib/utils";

dayjs.extend(relativeTime);

export function CauseDetails({ cause }: CauseDetailsProps) {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
  });

  const normalizedAddress = address?.toLowerCase() || "";
  const normalizedBeneficiary = `0x${cause.beneficiary}`.toLowerCase();
  const isCreator = normalizedAddress === normalizedBeneficiary;

  const totalRaised = cause.donations.reduce(
    (acc, curr) => acc + BigInt(curr.amount),
    BigInt(0)
  );
  const progress = Number(
    (totalRaised * BigInt(100)) / BigInt(cause.targetAmount)
  );

  const formatTimestamp = (timestamp: number) => {
    return dayjs.unix(timestamp).fromNow();
  };

  const handleWithdraw = async () => {
    try {
      if (!writeContract) {
        toast.error("Wallet not connected");
        return;
      }

      await writeContract({
        ...contractConfig,
        functionName: "withdrawFunds",
        args: [`0x${cause.causeId}`],
      });

      toast.success("Withdrawal initiated!");
    } catch (error) {
      console.error("Error withdrawing:", error);
      const message =
        error instanceof Error ? error.message : "Error processing withdrawal";
      toast.error(message);
    }
  };

  const isLoading = isPending || isConfirming;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column - Main Info */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-3">{cause.name}</h1>
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <ReactMarkdown>{cause.description}</ReactMarkdown>
            </div>
          </div>

          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Progress</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-2xl font-bold">
                      {formatEther(totalRaised)} ETH
                    </p>
                    <p className="text-sm text-gray-500">
                      raised of {formatEther(BigInt(cause.targetAmount))} ETH
                      goal
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {cause.donations.length}
                    </p>
                    <p className="text-sm text-gray-500">donations</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="donations" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="donations" className="flex-1">
                Donations
              </TabsTrigger>
              <TabsTrigger value="withdrawals" className="flex-1">
                Withdrawals
              </TabsTrigger>
              <TabsTrigger value="milestones" className="flex-1">
                Milestones
              </TabsTrigger>
            </TabsList>

            <TabsContent value="donations" className="space-y-4 mt-4">
              {cause.donations.length > 0 ? (
                cause.donations.map((donation) => (
                  <Card key={donation.id}>
                    <CardContent className="py-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">
                            {formatEther(BigInt(donation.amount))} ETH
                          </p>
                          <p className="text-sm text-gray-500">
                            from {donation.donor.slice(0, 6)}...
                            {donation.donor.slice(-4)}
                          </p>
                        </div>
                        <p className="text-sm text-gray-500">
                          {formatTimestamp(donation.timestamp)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-gray-500">
                    No donations yet. Be the first to donate!
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="withdrawals" className="space-y-4">
              {cause.withdrawals?.length > 0 ? (
                cause.withdrawals.map((withdrawal) => (
                  <Card key={withdrawal.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center">
                        <p className="font-medium">
                          {formatEther(BigInt(withdrawal.amount))} ETH withdrawn
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatTimestamp(withdrawal.timestamp)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-gray-500">
                    No withdrawals made yet
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="milestones" className="space-y-4">
              {cause.milestones?.length > 0 ? (
                cause.milestones.map((milestone) => (
                  <Card key={milestone.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center">
                        <p className="font-medium">
                          Milestone {milestone.index} completed
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatTimestamp(milestone.completionTime)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-gray-500">
                    No milestones completed yet
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="md:col-span-1">
          <div className="sticky top-4 space-y-4">
            <Card className="border-2">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <DonateCauseDialog cause={cause}>
                    <Button size="lg" className="w-full text-lg py-6">
                      Donate Now
                    </Button>
                  </DonateCauseDialog>

                  {isCreator && (
                    <Button
                      onClick={handleWithdraw}
                      variant="outline"
                      size="lg"
                      className="w-full text-lg py-6"
                      disabled={isLoading || !writeContract}
                    >
                      {isLoading ? "Processing..." : "Withdraw Funds"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Cause Details</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Created {formatTimestamp(cause.createdAt)}</p>
                  <p>
                    Beneficiary: {cause.beneficiary.slice(0, 6)}...
                    {cause.beneficiary.slice(-4)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
