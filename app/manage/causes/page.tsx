"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useCauses } from "@/lib/hooks/use-causes";
import { Cause } from "@/types";
import { formatEther } from "viem";
import Link from "next/link";
import { useAccount, useContractRead, useSignMessage } from "wagmi";
import { contractConfig } from "@/lib/utils";
import { redirect } from "next/navigation";
import { Search, Loader2, Plus, Star } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { Pagination } from "@/components/ui/pagination";
import { useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export default function ManageCausesPage() {
  const queryClient = useQueryClient();
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

  const { signMessageAsync } = useSignMessage();

  const handleFeatureToggle = async (
    causeId: string,
    currentFeatured: boolean
  ) => {
    const toastId = toast.loading("Please sign to update feature status...");

    try {
      const message = `Feature cause: ${causeId}`;
      const signature = await signMessageAsync({ message });

      const response = await fetch(`/api/causes/${causeId}/feature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signature,
          message,
          isFeatured: !currentFeatured,
        }),
      });

      if (!response.ok) throw new Error("Failed to update feature status");

      await queryClient.invalidateQueries({ queryKey: ["causes"] });

      toast.success(
        currentFeatured
          ? "Cause removed from featured section"
          : "Cause featured successfully",
        { id: toastId }
      );
    } catch (error) {
      console.error("Error toggling feature status:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update feature status",
        { id: toastId }
      );
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-16">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Loading causes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Manage Causes</h1>
          <p className="text-muted-foreground">
            Manage and feature your fundraising causes
          </p>
        </div>
        <Link href="/causes/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create New Cause
          </Button>
        </Link>
      </div>

      <div className="grid gap-6">
        <div className="flex justify-between items-center">
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
            {data?.items.length === 0 ? (
              <div className="text-center py-6">
                <div className="flex flex-col items-center gap-2">
                  <Star className="h-12 w-12 text-muted-foreground/30" />
                  <h3 className="text-lg font-semibold">No Causes Found</h3>
                  <p className="text-sm text-muted-foreground">
                    Get started by creating your first cause
                  </p>
                  <Link href="/causes/create" className="mt-4">
                    <Button>Create Cause</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Target Amount</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Donors</TableHead>
                    <TableHead>Featured</TableHead>
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
                          <div className="flex items-center gap-2">
                            {cause.isFeatured && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            )}
                            {cause.name}
                          </div>
                        </TableCell>
                        <TableCell>{formatEther(target)} ETH</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-secondary rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all"
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
                          <Switch
                            checked={cause.isFeatured}
                            onCheckedChange={() =>
                              handleFeatureToggle(
                                cause.causeId,
                                cause.isFeatured ?? false
                              )
                            }
                          />
                        </TableCell>
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
            )}

            {data && data.items.length > 0 && (
              <div className="mt-4 flex justify-center">
                <Pagination
                  currentPage={data.pagination.page}
                  totalPages={data.pagination.totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
