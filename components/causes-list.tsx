"use client";

import { useEffect, useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatEther } from "viem";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Target, Star } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useRouter } from "next/navigation";
import { Pagination } from "@/components/ui/pagination";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useCauses } from "@/lib/hooks/use-causes";
import { Cause } from "@/types";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

dayjs.extend(relativeTime);

interface CauseCardProps {
  cause: Cause;
  isFeatured: boolean;
}

function CauseCard({ cause, isFeatured }: CauseCardProps) {
  const raised = cause.donations.reduce(
    (acc, curr) => acc + BigInt(curr.amount),
    BigInt(0)
  );
  const target = BigInt(cause.targetAmount);
  const progress = Number((raised * BigInt(100)) / target);

  return (
    <Card
      className={cn(
        "transition-all duration-200",
        isFeatured
          ? "border-primary/50 shadow-lg hover:shadow-xl hover:border-primary"
          : "hover:border-primary"
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="line-clamp-1">{cause.name}</CardTitle>
          {isFeatured && (
            <span className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
              <Star className="h-3 w-3 fill-primary" />
              Featured
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground line-clamp-2 prose prose-sm dark:prose-invert">
          <ReactMarkdown>{cause.description}</ReactMarkdown>
        </div>
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm">
            <span className="font-medium">
              {formatEther(raised)} ETH raised
            </span>
            <span className="text-muted-foreground">
              of {formatEther(target)} ETH
            </span>
          </div>
        </div>
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>{cause.donationCount} donations</span>
          <span>{dayjs.unix(cause.createdAt).fromNow()}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/causes/${cause.causeId}`} className="w-full">
          <Button
            className={cn(
              "w-full",
              isFeatured && "bg-primary hover:bg-primary/90"
            )}
          >
            View Cause
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

interface CausesListProps {
  showFeaturedOnly?: boolean;
}

export function CausesList({ showFeaturedOnly = false }: CausesListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Cause[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedSearch = useDebounce(search, 300);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useCauses(currentPage, showFeaturedOnly);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchCauses = async (searchTerm: string) => {
    if (!searchTerm) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    try {
      const response = await fetch(
        `/api/search-causes?q=${encodeURIComponent(searchTerm)}`
      );
      const data = await response.json();
      setSearchResults(data?.items || []);
      setShowDropdown(true);
    } catch (error) {
      console.error("Failed to search causes:", error);
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  useEffect(() => {
    searchCauses(debouncedSearch);
  }, [debouncedSearch]);

  const getCauseProgress = (donations: { amount: string }[]) => {
    const total = donations.reduce(
      (acc, curr) => acc + BigInt(curr.amount),
      BigInt(0)
    );
    return total;
  };

  const formatTimestamp = (timestamp: number) => {
    return dayjs.unix(timestamp).fromNow();
  };

  const featuredCauses = data?.items.filter((cause) => cause.isFeatured) || [];
  const regularCauses = data?.items.filter((cause) => !cause.isFeatured) || [];

  if (isLoading) {
    return (
      <div className="container mx-auto py-16 text-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Loading causes...</p>
        </div>
      </div>
    );
  }

  if (data?.items.length === 0) {
    return (
      <div className="container mx-auto py-16 text-center">
        <div className="flex flex-col items-center gap-4">
          <Target className="h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No Causes Found</h3>
          <p className="text-muted-foreground">
            There are no active causes at the moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <div className="relative w-full max-w-sm" ref={searchRef}>
          <div className="relative">
            <Input
              placeholder="Search causes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              onFocus={() => setShowDropdown(true)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          </div>

          {/* Search Dropdown */}
          {showDropdown && search.length > 0 && (
            <div className="absolute w-full mt-1 bg-background rounded-md shadow-lg border max-h-60 overflow-auto z-50">
              {searchResults.length > 0 ? (
                searchResults.map((cause) => (
                  <div
                    key={cause.causeId}
                    className="px-4 py-3 hover:bg-muted cursor-pointer"
                    onClick={() => {
                      router.push(`/causes/${cause.causeId}`);
                      setShowDropdown(false);
                      setSearch("");
                    }}
                  >
                    <div className="font-medium">{cause.name}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {cause.description}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-muted-foreground">
                  No causes found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Beta Notice */}
      <div className="bg-muted/50 border rounded-lg p-6 space-y-3">
        <h3 className="text-lg font-semibold">🌟 Beta Testing Phase</h3>
        <p className="text-muted-foreground">
          We're currently in beta, and donation causes are being carefully
          curated. If you'd like to create a fundraising campaign, please
          contact us at{" "}
          <a
            href="mailto:support@transparentdonations.com"
            className="text-primary hover:underline"
          >
            support@transparentdonations.com
          </a>
        </p>
      </div>

      {/* Featured Causes Section - Only show if there are featured causes */}
      {!showFeaturedOnly && featuredCauses.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold flex items-center gap-2">
            Featured Causes
            <span className="bg-primary/10 text-primary text-sm px-2 py-1 rounded-full">
              Verified
            </span>
          </h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredCauses.map((cause) => (
              <CauseCard key={cause.causeId} cause={cause} isFeatured={true} />
            ))}
          </div>
        </div>
      )}

      {/* Regular Causes Section - Only show heading if there are regular causes */}
      {!showFeaturedOnly && regularCauses.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold">
            {featuredCauses.length > 0 ? "All Causes" : "Causes"}
          </h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {regularCauses.map((cause) => (
              <CauseCard key={cause.causeId} cause={cause} isFeatured={false} />
            ))}
          </div>
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            currentPage={data.pagination.page}
            totalPages={data.pagination.totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
