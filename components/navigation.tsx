"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, Plus, Settings, X } from "lucide-react";
import { Button } from "./ui/button";
import { useAccount, useContractRead } from "wagmi";
import { contractConfig } from "@/lib/utils";
import { WalletConnect } from "./wallet-connect";
import { useState } from "react";

export function Navigation() {
  const pathname = usePathname();
  const { address } = useAccount();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: contractOwner } = useContractRead({
    ...contractConfig,
    functionName: "owner",
  });
  const isContractOwner =
    address &&
    typeof contractOwner === "string" &&
    address.toLowerCase() === contractOwner.toLowerCase();

  const NavLinks = () => (
    <>
      <Link
        href="/"
        className={cn(
          "px-3 py-2 text-sm font-medium",
          pathname === "/" ? "text-primary" : "text-muted-foreground"
        )}
        onClick={() => setIsMobileMenuOpen(false)}
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
        onClick={() => setIsMobileMenuOpen(false)}
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
          onClick={() => setIsMobileMenuOpen(false)}
        >
          Manage Causes
        </Link>
      )}
      <Link
        href="/leaderboard"
        className={cn(
          "px-3 py-2 text-sm font-medium",
          pathname === "/leaderboard" ? "text-primary" : "text-muted-foreground"
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        Leaderboard
      </Link>
    </>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b h-16">
      <div className="container mx-auto px-4 h-full">
        <div className="flex h-full items-center justify-between">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <NavLinks />
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>

          <div className="flex items-center space-x-4">
            <WalletConnect />
            {isContractOwner && (
              <div className="hidden md:flex items-center space-x-4">
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
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-background border-b shadow-lg">
            <div className="flex flex-col py-4 px-4 space-y-2">
              <NavLinks />
              {isContractOwner && (
                <div className="pt-2 space-y-2">
                  <Link href="/causes/create">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full flex items-center justify-center space-x-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Plus className="h-4 w-4" />
                      <span>Create Cause</span>
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
