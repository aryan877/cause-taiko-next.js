"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCauses } from "@/lib/hooks/use-causes";
import { Cause } from "@/types";
import { formatEther } from "viem";
import Link from "next/link";
import { useAccount, useContractRead } from "wagmi";
import { contractConfig } from "@/lib/utils";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ManageCausesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Cause[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedSearch = useDebounce(search, 300);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useCauses(currentPage);

  const { address } = useAccount();
  const { data: contractOwner } = useContractRead({
    ...contractConfig,
    functionName: "owner",
  });

  const isContractOwner =
    address &&
    contractOwner &&
    typeof address === "string" &&
    typeof contractOwner === "string" &&
    address.toLowerCase() === contractOwner.toLowerCase();

  // Redirect if not contract owner
  if (!isContractOwner) {
    redirect("/");
  }

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

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Causes</h1>
        <Link href="/causes/create">
          <Button>Create New Cause</Button>
        </Link>
      </div>

      <div className="mb-6">
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
            <div className="absolute w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto z-50">
              {searchResults.length > 0 ? (
                searchResults.map((cause) => (
                  <Link
                    key={cause.causeId}
                    href={`/manage/causes/${cause.causeId}/milestones`}
                  >
                    <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                      <div className="font-medium">{cause.name}</div>
                      <div className="text-sm text-gray-500 truncate">
                        Target: {formatEther(BigInt(cause.targetAmount))} ETH
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="px-4 py-2 text-gray-500">No causes found</div>
              )}
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Causes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : data?.items.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No causes found
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Target Amount</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Donors</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.items.map((cause) => {
                    const raised = cause.donations.reduce(
                      (acc, curr) => acc + BigInt(curr.amount),
                      BigInt(0)
                    );
                    const target = BigInt(cause.targetAmount);
                    const progress = Math.round(
                      (Number(raised) * 100) / Number(target)
                    );

                    return (
                      <TableRow key={cause.causeId}>
                        <TableCell className="font-medium">
                          {cause.name}
                        </TableCell>
                        <TableCell>{formatEther(target)} ETH</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-primary h-2.5 rounded-full"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm whitespace-nowrap">
                              {progress}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{cause.donationCount}</TableCell>
                        <TableCell>
                          <Link
                            href={`/manage/causes/${cause.causeId}/milestones`}
                          >
                            <Button variant="outline" size="sm">
                              Manage Milestones
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {data && (
                <div className="mt-4">
                  <Pagination
                    currentPage={data.pagination.page}
                    totalPages={data.pagination.totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
