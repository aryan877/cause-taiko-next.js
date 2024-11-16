"use client";

import { useAccount } from "wagmi";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEther } from "viem";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { useDonations } from "@/lib/hooks/use-donations";
import { ExternalLink, Trophy, Target, Wallet, Loader2 } from "lucide-react";

dayjs.extend(relativeTime);

export default function MyDonationsPage() {
  const { address } = useAccount();
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading } = useDonations(address, currentPage);

  const activities = data?.items ?? [];
  const totalPages = data?.pagination.totalPages ?? 1;

  const stats = activities.reduce(
    (acc, activity) => {
      if (activity.type === "donation" && activity.amount) {
        acc.totalDonated += BigInt(activity.amount);
        acc.causesSupported.add(activity.causeId);
        if (activity.impactScore) {
          acc.totalImpact += activity.impactScore;
        }
      }
      if (activity.type === "badge" && activity.badgeType) {
        acc.badges.add(activity.badgeType);
      }
      return acc;
    },
    {
      totalDonated: BigInt(0),
      causesSupported: new Set<string>(),
      badges: new Set<string>(),
      totalImpact: 0,
    }
  );

  if (!address) {
    return (
      <div className="container mx-auto py-16 text-center">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="py-12">
              <div className="space-y-4">
                <Wallet className="w-12 h-12 mx-auto text-gray-400" />
                <h1 className="text-2xl font-bold">Connect Your Wallet</h1>
                <p className="text-gray-500">
                  Connect your wallet to view your donation history and earned
                  badges.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-16 text-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">
            Loading your donations...
          </p>
        </div>
      </div>
    );
  }

  const badges = Array.from(stats.badges);
  const hasBadges = badges.length > 0;

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Donations</h1>
        <Link href="/">
          <Button>Donate to Causes</Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-pink-50 to-white dark:from-pink-950 dark:to-background">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Contributions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatEther(stats.totalDonated)} ETH
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Across {stats.causesSupported.size} causes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-background">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Impact Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalImpact}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Total impact points
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950 dark:to-background">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
          </CardHeader>
          <CardContent>
            {hasBadges ? (
              <div className="flex gap-2 flex-wrap">
                {badges.map((badge) => (
                  <div
                    key={badge}
                    className="flex items-center gap-2 bg-white dark:bg-background rounded-lg px-3 py-2 shadow-sm"
                  >
                    <span className="text-xl">
                      {badge === "BRONZE" && "🥉"}
                      {badge === "SILVER" && "🥈"}
                      {badge === "GOLD" && "🥇"}
                      {badge === "DIAMOND" && "💎"}
                    </span>
                    <span className="font-medium">{badge}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Make donations to earn badges!
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {activities.length > 0 ? (
              <>
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                        {activity.type === "donation" ? (
                          <Target className="w-5 h-5 text-pink-500" />
                        ) : (
                          <Trophy className="w-5 h-5 text-yellow-500" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <Link
                          href={`/causes/${activity.causeId}`}
                          className="font-medium hover:text-primary"
                        >
                          {activity.causeName}
                        </Link>
                        {activity.type === "donation" && (
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>
                              {formatEther(BigInt(activity.amount || "0"))} ETH
                            </span>
                            {activity.impactScore && (
                              <Badge variant="secondary">
                                +{activity.impactScore} Impact
                              </Badge>
                            )}
                          </div>
                        )}
                        {activity.type === "badge" && (
                          <p className="text-sm text-muted-foreground">
                            Earned {activity.badgeType} Badge 🏆
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {dayjs.unix(activity.timestamp).fromNow()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://hekla.taikoscan.io/tx/0x${activity.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-pink-500 hover:text-pink-600"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
                <div className="mt-6 flex justify-center">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Target className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Activity Yet</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Start your giving journey by supporting a cause.
                </p>
                <Link href="/causes">
                  <Button variant="outline">Browse Causes</Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
