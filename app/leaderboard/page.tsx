"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatEther } from "viem";
import Link from "next/link";
import { Copy, ExternalLink, Trophy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Pagination } from "@/components/ui/pagination";

export default function LeaderboardPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard", currentPage, limit],
    queryFn: async () => {
      const response = await fetch(
        `/api/leaderboard?page=${currentPage}&limit=${limit}`
      );
      if (!response.ok) throw new Error("Failed to fetch leaderboard");
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

  const getTaikoExplorerUrl = (address: string) => {
    return `https://hekla.taikoscan.io/address/${address}`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-16 text-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">
            Loading leaderboard...
          </p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(data.total / limit);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Global Leaderboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Top donors making an impact in the community
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {data.items.map((donor: any, index: number) => (
          <Card
            key={donor.address}
            className="hover:border-primary transition-colors"
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-gradient-to-br from-pink-500 to-purple-500 rounded-full text-white font-bold">
                  #{(currentPage - 1) * limit + index + 1}
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/users/${donor.address}`}
                      className="font-medium hover:text-primary"
                    >
                      {donor.address.slice(0, 6)}...{donor.address.slice(-4)}
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(donor.address)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <a
                      href={getTaikoExplorerUrl(donor.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-500 hover:text-pink-600"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  <p className="text-2xl font-bold mt-1">
                    {formatEther(BigInt(donor.totalDonated))} ETH
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {donor.donationCount} donation
                    {donor.donationCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
