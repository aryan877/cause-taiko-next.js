"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatEther } from "viem";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { UserProfile } from "@/types";

dayjs.extend(relativeTime);

export default function UserProfilePage() {
  const params = useParams();
  const address = params.address as string;
  const [donationsSort, setDonationsSort] = useState<"recent" | "amount">(
    "recent"
  );

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["user-profile", address],
    queryFn: async () => {
      const response = await fetch(`/api/users/${address}`);
      if (!response.ok) throw new Error("Failed to fetch user profile");
      return response.json();
    },
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const getTaikoExplorerUrl = (hash: string, type: "tx" | "address" = "tx") => {
    const baseUrl = "https://hekla.taikoscan.io";
    return `${baseUrl}/${type}/${hash}`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-16 text-center">
        Loading profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
        <p className="text-gray-500">
          This address hasn't made any donations yet.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Profile Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Donor Profile</h1>
          <div className="flex items-center gap-2 text-gray-500">
            <span>{address}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => copyToClipboard(address)}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <a
              href={getTaikoExplorerUrl(address, "address")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-pink-500 hover:text-pink-600"
            >
              <ExternalLink className="h-4 w-4" />
              View on Explorer
            </a>
          </div>
        </div>
      </div>

      {/* Updated Stats Grid */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-background">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Donated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatEther(BigInt(profile.totalDonated))} ETH
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-background">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Causes Supported
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.causesSupported}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Projects funded
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-white dark:from-pink-950 dark:to-background">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Impact Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.impactScore}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Total impact points
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950 dark:to-background">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Badges Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.badges.length}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Achievement badges
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="donations" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="donations" className="flex-1">
            Donations
          </TabsTrigger>
          <TabsTrigger value="badges" className="flex-1">
            Badges
          </TabsTrigger>
        </TabsList>

        <TabsContent value="donations" className="space-y-4 mt-4">
          {profile.donations.length > 0 ? (
            <>
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

              {[...profile.donations]
                .sort((a, b) => {
                  if (donationsSort === "amount") {
                    return BigInt(b.amount) > BigInt(a.amount) ? 1 : -1;
                  }
                  return b.timestamp - a.timestamp;
                })
                .map((donation) => (
                  <Card key={donation.id}>
                    <CardContent className="py-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <Link
                            href={`/causes/${donation.causeId}`}
                            className="font-medium hover:text-primary"
                          >
                            {donation.causeName}
                          </Link>
                          <p className="text-sm text-gray-500">
                            Donated {formatEther(BigInt(donation.amount))} ETH
                          </p>
                          <p className="text-sm text-gray-500">
                            Impact Score: {donation.impactScore}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {dayjs.unix(donation.timestamp).fromNow()}
                          </p>
                          <a
                            href={getTaikoExplorerUrl(donation.transactionHash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-pink-500 hover:text-pink-600"
                          >
                            View Transaction
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="space-y-3">
                  <div className="text-4xl">🎯</div>
                  <h3 className="text-lg font-semibold">No Donations Yet</h3>
                  <p className="text-sm text-gray-500">
                    This user hasn't made any donations yet.
                  </p>
                  <Link href="/causes">
                    <Button variant="outline" className="mt-4">
                      Explore Causes
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="badges" className="mt-4">
          {profile.badges.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {profile.badges.map((badge) => (
                <Card key={badge.type}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-pink-100 dark:bg-pink-900 rounded-full">
                        <span className="text-2xl">
                          {badge.type === "BRONZE" && "🥉"}
                          {badge.type === "SILVER" && "🥈"}
                          {badge.type === "GOLD" && "🥇"}
                          {badge.type === "DIAMOND" && "💎"}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold">{badge.type} Badge</h3>
                        <p className="text-sm text-gray-500">
                          Earned {dayjs.unix(badge.earnedAt).fromNow()}
                        </p>
                        <a
                          href={getTaikoExplorerUrl(badge.transactionHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-pink-500 hover:text-pink-600 inline-flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View on Explorer
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="space-y-3">
                  <div className="text-4xl">🏆</div>
                  <h3 className="text-lg font-semibold">No Badges Yet</h3>
                  <p className="text-sm text-gray-500">
                    Make donations to earn badges and recognition!
                  </p>
                  <div className="mt-4 space-y-2">
                    <p className="text-xs text-gray-500">Badge Thresholds:</p>
                    <div className="flex justify-center gap-4">
                      <Badge variant="secondary">Bronze: 0.1 ETH</Badge>
                      <Badge variant="secondary">Silver: 0.5 ETH</Badge>
                      <Badge variant="secondary">Gold: 1 ETH</Badge>
                      <Badge variant="secondary">Diamond: 5 ETH</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
