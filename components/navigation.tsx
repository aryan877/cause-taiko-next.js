"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { Button } from "./ui/button";

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b">
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
          </div>

          <Link href="/causes/create">
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Create Cause</span>
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
