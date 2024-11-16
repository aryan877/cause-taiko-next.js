"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Plus, Settings } from "lucide-react";
import { Button } from "./ui/button";
import { useAccount, useContractRead } from "wagmi";
import { contractConfig } from "@/lib/utils";
import { WalletConnect } from "./wallet-connect";

export function Navigation() {
  const pathname = usePathname();
  const { address } = useAccount();

  const { data: contractOwner } = useContractRead({
    ...contractConfig,
    functionName: "owner",
  });
  const isContractOwner =
    address &&
    typeof contractOwner === "string" &&
    address.toLowerCase() === contractOwner.toLowerCase();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className={cn(
                "px-3 py-2 text-sm font-medium",
                pathname === "/" ? "text-primary" : "text-muted-foreground"
              )}
            >
              Home
            </Link>
            <Link
              href="/my-donations"
              className={cn(
                "px-3 py-2 text-sm font-medium",
                pathname === "/my-donations"
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              My Donations
            </Link>
            {isContractOwner && (
              <Link
                href="/manage/causes"
                className={cn(
                  "px-3 py-2 text-sm font-medium",
                  pathname.startsWith("/manage/causes")
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                Manage Causes
              </Link>
            )}
            <Link
              href="/leaderboard"
              className={cn(
                "px-3 py-2 text-sm font-medium",
                pathname === "/leaderboard"
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              Leaderboard
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <WalletConnect />
            {isContractOwner && (
              <>
                <Link href="/causes/create">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Cause</span>
                  </Button>
                </Link>
                <Link href="/manage/causes">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="sr-only">Manage Causes</span>
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
