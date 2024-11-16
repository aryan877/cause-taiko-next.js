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
    }
  );

  if (!address) {
    return (
      <div className="container mx-auto py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
        <p className="text-gray-500">
          Please connect your wallet to view your donations.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-16 text-center">
        <p>Loading your donations...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Donated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatEther(stats.totalDonated)} ETH
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Causes Supported
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.causesSupported.size}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Badges Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.badges.size}</div>
            <div className="flex gap-2 mt-2">
              {Array.from(stats.badges).map((badge) => (
                <Badge key={badge} variant="secondary">
                  {badge}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Donation History</CardTitle>
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
                    <div className="space-y-1">
                      <p className="font-medium">{activity.causeName}</p>
                      {activity.type === "donation" && (
                        <p className="text-sm text-muted-foreground">
                          Donated {formatEther(BigInt(activity.amount || "0"))}{" "}
                          ETH
                        </p>
                      )}
                      {activity.type === "badge" && (
                        <p className="text-sm text-muted-foreground">
                          Earned {activity.badgeType} Badge 🏆
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {dayjs.unix(activity.timestamp).fromNow()}
                      </p>
                    </div>
                    {activity.type === "donation" && (
                      <Link href={`/causes/${activity.causeId}`}>
                        <Button variant="outline" size="sm">
                          View Cause
                        </Button>
                      </Link>
                    )}
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
              <div className="text-center py-8 text-muted-foreground">
                <p>You haven&apos;t made any donations yet.</p>
                <Link href="/causes" className="mt-4 inline-block">
                  <Button variant="outline">Explore Causes</Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
