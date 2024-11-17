"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import RichTextEditor from "@/components/rich-text-editor";
import { parseEther } from "viem";
import { useWriteContract } from "wagmi";
import { contractConfig, config } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAccount, useContractRead } from "wagmi";
import { redirect } from "next/navigation";
import { waitForTransactionReceipt } from "@wagmi/core";

export default function CreateCausePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [beneficiary, setBeneficiary] = useState("");
  const [targetAmount, setTargetAmount] = useState("");

  const { writeContract } = useWriteContract({
    mutation: {
      onMutate: () => {
        return toast.loading("Initiating cause creation...");
      },
      onSuccess: async (hash, _, toastId) => {
        const explorerUrl = `https://hekla.taikoscan.io/tx/${hash}`;
        toast.loading(
          <div className="flex flex-col gap-2">
            <p>Waiting for confirmation...</p>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:text-blue-600 underline"
            >
              View on Explorer
            </a>
          </div>,
          { id: toastId }
        );

        try {
          await waitForTransactionReceipt(config, {
            hash,
            confirmations: 1,
          });

          toast.success(
            <div className="flex flex-col gap-2">
              <p>Cause created successfully!</p>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:text-blue-600 underline"
              >
                View on Explorer
              </a>
            </div>,
            { id: toastId }
          );

          setTimeout(() => {
            router.push("/");
          }, 2000);
        } catch {
          toast.error("Failed to create cause", { id: toastId });
        }
      },
      onError: (error, _, toastId) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to create cause",
          { id: toastId }
        );
      },
    },
  });

  const { address, isConnected } = useAccount();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !description || !beneficiary || !targetAmount) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      if (!writeContract) {
        toast.error("Wallet not connected");
        return;
      }

      await writeContract({
        ...contractConfig,
        functionName: "createCause",
        args: [name, description, beneficiary, parseEther(targetAmount)],
      });
    } catch (error) {
      console.error("Error creating cause:", error);
      toast.error(
        error instanceof Error ? error.message : "Error creating cause"
      );
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Create a New Cause</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Cause Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter cause name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <RichTextEditor value={description} onChange={setDescription} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="beneficiary">Beneficiary Address</Label>
              <Input
                id="beneficiary"
                value={beneficiary}
                onChange={(e) => setBeneficiary(e.target.value)}
                placeholder="0x..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetAmount">Target Amount (ETH)</Label>
              <Input
                id="targetAmount"
                type="number"
                step="0.01"
                min="0"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="0.0"
              />
            </div>

            <Button type="submit" className="w-full" disabled={!isConnected}>
              {isConnected ? "Create Cause" : "Wallet not connected"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
