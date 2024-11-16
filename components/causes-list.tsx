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
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useRouter } from "next/navigation";
import { Pagination } from "@/components/ui/pagination";
import dayjs from "dayjs";
import { useCauses } from "@/lib/hooks/use-causes";
import { Cause } from "@/types";

export function CausesList() {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Cause[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedSearch = useDebounce(search, 300);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useCauses(currentPage);

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

  return (
    <div className="space-y-6">
      <div className="relative w-full max-w-sm mb-8" ref={searchRef}>
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

        {/* Custom Dropdown */}
        {showDropdown && search.length > 0 && (
          <div className="absolute w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto z-50">
            {searchResults.length > 0 ? (
              searchResults.map((cause) => (
                <div
                  key={cause.causeId}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    router.push(`/causes/${cause.causeId}`);
                    setShowDropdown(false);
                    setSearch("");
                  }}
                >
                  <div className="font-medium">{cause.name}</div>
                  <div className="text-sm text-gray-500 truncate">
                    {cause.description}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-gray-500">No causes found</div>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading causes...</div>
      ) : data?.items.length === 0 ? (
        <div className="text-center py-8">No causes found</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data?.items.map((cause) => {
            const raised = getCauseProgress(cause.donations);
            const target = BigInt(cause.targetAmount);
            const progress = Number((raised * BigInt(100)) / target);

            return (
              <Card key={cause.causeId}>
                <CardHeader>
                  <CardTitle>{cause.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    {cause.description}
                  </p>
                  <Progress value={progress} className="mb-2" />
                  <div className="flex justify-between text-sm">
                    <span>Raised: {formatEther(raised)} ETH</span>
                    <span>Goal: {formatEther(target)} ETH</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatTimestamp(cause.createdAt)}
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/causes/${cause.causeId}`} className="w-full">
                    <Button className="w-full">Donate</Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {data && data.items.length > 0 && (
        <Pagination
          currentPage={data.pagination.page}
          totalPages={data.pagination.totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
