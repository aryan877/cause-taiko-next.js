/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { useAccount, useWriteContract } from "wagmi";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { contractConfig } from "@/lib/utils";
import {
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Share2,
  LineChart as ChartIcon,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import {
  GridComponent,
  TooltipComponent,
  ToolboxComponent,
} from "echarts/components";
import { LineChart } from "echarts/charts";
import { UniversalTransition } from "echarts/features";
import { CanvasRenderer } from "echarts/renderers";
import { Updates } from "./updates";
import { useQueryClient } from "@tanstack/react-query";
import { waitForTransactionReceipt } from "@wagmi/core";
import { config } from "@/lib/utils";

dayjs.extend(relativeTime);

echarts.use([
  GridComponent,
  TooltipComponent,
  ToolboxComponent,
  LineChart,
  CanvasRenderer,
  UniversalTransition,
]);

export function CauseDetails({ cause }: CauseDetailsProps) {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();

  const { writeContract } = useWriteContract({
    mutation: {
      onMutate: () => {
        return toast.loading("Initiating withdrawal...");
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
              <p>Funds withdrawn successfully!</p>
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

          await queryClient.invalidateQueries({
            queryKey: ["cause", cause.causeId],
          });
        } catch {
          toast.error("Failed to withdraw funds", { id: toastId });
        }
      },
      onError: (error, _, toastId) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to withdraw funds",
          { id: toastId }
        );
      },
    },
  });

  const normalizedAddress = address?.toLowerCase() || "";
  const normalizedBeneficiary = `0x${cause.beneficiary}`.toLowerCase();
  const isCreator = normalizedAddress === normalizedBeneficiary;

  const totalRaised = BigInt(cause.totalDonated ?? "0");
  const progress = Number(
    (BigInt(cause.totalDonated ?? "0") * BigInt(100)) /
      BigInt(cause.targetAmount)
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
    } catch (error) {
      console.error("Error withdrawing:", error);
      toast.error(
        error instanceof Error ? error.message : "Error processing withdrawal"
      );
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!", {
        duration: 2000,
        position: "bottom-right",
      });
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy to clipboard", {
        duration: 2000,
        position: "bottom-right",
      });
    }
  };

  const getTaikoExplorerUrl = (hash: string, type: "tx" | "address" = "tx") => {
    const baseUrl = "https://hekla.taikoscan.io";
    const formattedHash = hash.startsWith("0x") ? hash : `0x${hash}`;
    return type === "tx"
      ? `${baseUrl}/tx/${formattedHash}`
      : `${baseUrl}/address/${formattedHash}`;
  };

  const [donationsSort, setDonationsSort] = useState<"recent" | "amount">(
    "recent"
  );

  const remainingAmount = BigInt(cause.remainingAmount ?? "0");
  const hasRemainingFunds = remainingAmount > BigInt(0);

  const [isExpanded, setIsExpanded] = useState(false);
  const MAX_LENGTH = 300;
  const shouldShowReadMore = cause.description.length > MAX_LENGTH;

  const chartData = (Array.isArray(cause.donations) ? cause.donations : [])
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((donation) => ({
      timestamp: donation.timestamp * 1000,
      amount: Number(formatEther(BigInt(donation.amount))),
      cumulative: 0,
    }));

  let runningTotal = 0;
  chartData.forEach((data) => {
    runningTotal += data.amount;
    data.cumulative = runningTotal;
  });

  const handleRefresh = async () => {
    const toastId = toast.loading("Refreshing cause data...");
    try {
      await queryClient.invalidateQueries({
        queryKey: ["cause", cause.causeId],
      });
      toast.success("Data refreshed!", { id: toastId });
    } catch {
      toast.error("Failed to refresh data", { id: toastId });
    }
  };

  const DonationChart = () => {
    if (!Array.isArray(cause.donations) || cause.donations.length === 0) {
      return (
        <div className="space-y-4">
          <Card className="border-2">
            <CardContent className="pt-6 px-2 sm:px-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Donation History</h3>
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  size="sm"
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Data
                </Button>
              </div>
              <div className="h-[300px] w-full flex flex-col items-center justify-center text-muted-foreground">
                <ChartIcon className="h-12 w-12 mb-4 text-muted-foreground/30" />
                <p className="text-lg font-medium">No donations yet</p>
                <p className="text-sm">Be the first one to donate!</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg">
                    {formatEther(totalRaised)} ETH raised
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    of {formatEther(BigInt(cause.targetAmount))} ETH goal
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{progress}% complete</p>
                  <p className="text-sm text-muted-foreground">
                    {cause.donationCount} donation
                    {cause.donationCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <Progress value={progress} className="h-2" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Average Donation
                  </p>
                  <p className="font-medium">
                    {formatEther(
                      totalRaised / BigInt(Math.max(cause.donationCount, 1))
                    )}{" "}
                    ETH
                  </p>
                </div>
                {hasRemainingFunds && isCreator && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Available to Withdraw
                    </p>
                    <p className="font-medium">
                      {formatEther(remainingAmount)} ETH
                    </p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Total Withdrawn
                  </p>
                  <p className="font-medium">
                    {formatEther(BigInt(cause.totalWithdrawn ?? "0"))} ETH
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    const option = {
      tooltip: {
        trigger: "axis",
        formatter: (params: any) => {
          const data = params[0];
          return `
            <div class="p-2">
              <div class="font-medium">${dayjs(data.value[0]).format(
                "MMM D, YYYY HH:mm"
              )}</div>
              <div class="text-pink-500">Total: ${data.value[1].toFixed(
                4
              )} ETH</div>
            </div>
          `;
        },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "time",
        axisLine: {
          lineStyle: {
            color: "#666",
          },
        },
        axisLabel: {
          formatter: (value: number) => dayjs(value).format("MMM D"),
        },
      },
      yAxis: {
        type: "value",
        axisLine: {
          lineStyle: {
            color: "#666",
          },
        },
        axisLabel: {
          formatter: (value: number) => `${value} ETH`,
        },
      },
      series: [
        {
          name: "Total Donations",
          type: "line",
          smooth: true,
          symbol: "none",
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(255, 0, 122, 0.3)" },
              { offset: 1, color: "rgba(255, 0, 122, 0.05)" },
            ]),
          },
          lineStyle: {
            color: "#ff007a",
            width: 2,
          },
          data: chartData.map((item) => [item.timestamp, item.cumulative]),
        },
      ],
      animation: true,
      animationDuration: 1000,
      animationEasing: "cubicOut",
    };

    return (
      <div className="space-y-4">
        <Card className="border-2">
          <CardContent className="pt-6 px-2 sm:px-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Donation History</h3>
              <Button
                variant="outline"
                onClick={handleRefresh}
                size="sm"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Data
              </Button>
            </div>
            <div className="h-[300px] w-full">
              <ReactEChartsCore
                echarts={echarts}
                option={option}
                notMerge={true}
                lazyUpdate={true}
                style={{ height: "100%", width: "100%" }}
                theme="custom"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg">
                  {formatEther(totalRaised)} ETH raised
                </h3>
                <p className="text-sm text-gray-500">
                  of {formatEther(BigInt(cause.targetAmount))} ETH goal
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">{progress}% complete</p>
                <p className="text-sm text-gray-500">
                  {cause.donationCount} donation
                  {cause.donationCount !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <Progress value={progress} className="h-2" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Average Donation</p>
                <p className="font-medium">
                  {formatEther(
                    totalRaised / BigInt(Math.max(cause.donationCount, 1))
                  )}{" "}
                  ETH
                </p>
              </div>
              {hasRemainingFunds && isCreator && (
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Available to Withdraw</p>
                  <p className="font-medium">
                    {formatEther(remainingAmount)} ETH
                  </p>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Total Withdrawn</p>
                <p className="font-medium">
                  {formatEther(BigInt(cause.totalWithdrawn ?? "0"))} ETH
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const handleShare = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!", {
        duration: 2000,
        position: "bottom-right",
      });
    } catch (error) {
      console.error("Error copying link:", error);
      toast.error("Failed to copy link", {
        duration: 2000,
        position: "bottom-right",
      });
    }
  };

  const sortedDonations = Array.isArray(cause.donations)
    ? [...cause.donations].sort((a, b) => {
        if (donationsSort === "amount") {
          return BigInt(b.amount) > BigInt(a.amount) ? 1 : -1;
        }
        return b.timestamp - a.timestamp;
      })
    : [];

  return (
    <div className="container mx-auto px-4 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-3xl font-bold">{cause.name}</h1>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            </div>
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <div
                className={`relative ${
                  !isExpanded && shouldShowReadMore
                    ? "max-h-[200px] overflow-hidden"
                    : ""
                }`}
              >
                <ReactMarkdown>
                  {isExpanded
                    ? cause.description
                    : cause.description.slice(0, MAX_LENGTH)}
                </ReactMarkdown>
                {!isExpanded && shouldShowReadMore && (
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />
                )}
              </div>
              {shouldShowReadMore && (
                <Button
                  variant="ghost"
                  className="mt-2 flex items-center gap-2"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? (
                    <>
                      Show Less <ChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Read More <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          <DonationChart />

          <Tabs defaultValue="donations" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="donations" className="flex-1">
                Donations
              </TabsTrigger>
              <TabsTrigger value="updates" className="flex-1">
                Updates
              </TabsTrigger>
              <TabsTrigger value="top-donors" className="flex-1">
                Top Donors
              </TabsTrigger>
              <TabsTrigger value="withdrawals" className="flex-1">
                Withdrawals
              </TabsTrigger>
              <TabsTrigger value="milestones" className="flex-1">
                Milestones
              </TabsTrigger>
            </TabsList>

            <TabsContent value="donations" className="space-y-4 mt-4">
              <div className="flex justify-end">
                <select
                  className="text-sm border rounded-md px-2 py-1"
                  value={donationsSort}
                  onChange={(e) =>
                    setDonationsSort(e.target.value as "recent" | "amount")
                  }
                >
                  <option value="recent">Most Recent</option>
                  <option value="amount">Highest Amount</option>
                </select>
              </div>

              {sortedDonations.length > 0 ? (
                sortedDonations.map((donation) => (
                  <Card key={donation.id}>
                    <CardContent className="py-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">
                              {formatEther(BigInt(donation.amount))} ETH
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-gray-500">
                                  {donation.donor.slice(0, 6)}...
                                  {donation.donor.slice(-4)}
                                </p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    copyToClipboard(donation.donor)
                                  }
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="flex items-center gap-2">
                                <Link href={`/users/${donation.donor}`}>
                                  <Button variant="outline" size="sm">
                                    View Profile
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-500">
                            {formatTimestamp(donation.timestamp)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-pink-500 hover:text-pink-600">
                          <ExternalLink className="h-4 w-4" />
                          <a
                            href={getTaikoExplorerUrl(donation.transactionHash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="break-all"
                          >
                            0x{donation.transactionHash}
                          </a>
                        </div>
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

            <TabsContent value="updates" className="space-y-4">
              <Updates
                causeId={cause.causeId}
                beneficiary={cause.beneficiary}
              />
            </TabsContent>

            <TabsContent value="top-donors" className="space-y-4 mt-4">
              {cause.topDonors && cause.topDonors.length > 0 ? (
                cause.topDonors.map((donor, index) => (
                  <Card key={donor.address}>
                    <CardContent className="py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-pink-100 dark:bg-pink-900 rounded-full">
                          <span className="text-lg font-bold text-pink-600 dark:text-pink-300">
                            #{index + 1}
                          </span>
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-lg">
                              {formatEther(BigInt(donor.totalDonated))} ETH
                            </span>
                            <span className="text-sm text-gray-500">
                              ({donor.donationCount} donation
                              {donor.donationCount !== 1 ? "s" : ""})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              {donor.address.slice(0, 6)}...
                              {donor.address.slice(-4)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() =>
                                copyToClipboard(`0x${donor.address}`)
                              }
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <a
                              href={getTaikoExplorerUrl(
                                donor.address,
                                "address"
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-sm text-pink-500 hover:text-pink-600"
                            >
                              <ExternalLink className="h-3 w-3" />
                              View on Explorer
                            </a>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {index === 0 && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                              👑 Top Donor
                            </span>
                          )}
                        </div>
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
                    <CardContent className="py-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">
                              {formatEther(BigInt(withdrawal.amount))} ETH
                              withdrawn
                            </p>
                          </div>
                          <p className="text-sm text-gray-500">
                            {formatTimestamp(withdrawal.timestamp)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-pink-500 hover:text-pink-600">
                          <ExternalLink className="h-4 w-4" />
                          <a
                            href={getTaikoExplorerUrl(
                              withdrawal.transactionHash
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="break-all"
                          >
                            0x{withdrawal.transactionHash}a
                          </a>
                        </div>
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
                    <CardContent className="py-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <p className="font-medium">
                            Milestone {milestone.index} completed
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-pink-500 hover:text-pink-600">
                          <ExternalLink className="h-4 w-4" />
                          <a
                            href={getTaikoExplorerUrl(
                              milestone.transactionHash
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="break-all"
                          >
                            0x{milestone.transactionHash}
                          </a>
                        </div>
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

        <div className="lg:col-span-1">
          <div className="sticky top-20 space-y-4">
            <Card className="border-2">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <DonateCauseDialog cause={cause}>
                    <Button size="lg" className="w-full text-lg py-6">
                      Donate Now
                    </Button>
                  </DonateCauseDialog>

                  {isCreator && (
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">
                        <p>Available to withdraw:</p>
                        <p className="text-xl font-bold">
                          {formatEther(remainingAmount)} ETH
                        </p>
                      </div>
                      <Button
                        onClick={handleWithdraw}
                        variant="outline"
                        size="lg"
                        className="w-full text-lg py-6"
                        disabled={!isConnected || !hasRemainingFunds}
                      >
                        {!isConnected
                          ? "Wallet not connected"
                          : hasRemainingFunds
                          ? "Withdraw Funds"
                          : "No funds to withdraw"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Cause Details</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Created {formatTimestamp(cause.createdAt)}</p>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span>Beneficiary:</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() =>
                          copyToClipboard(`0x${cause.beneficiary}`)
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-pink-500 hover:text-pink-600">
                      <ExternalLink className="h-4 w-4" />
                      <a
                        href={getTaikoExplorerUrl(cause.beneficiary, "address")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all"
                      >
                        0x{cause.beneficiary}
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
