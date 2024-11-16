"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import RichTextEditor from "@/components/rich-text-editor";
import { parseEther } from "viem";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { contractConfig } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function CreateCausePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [beneficiary, setBeneficiary] = useState("");
  const [targetAmount, setTargetAmount] = useState("");

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
  });

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

      toast.success("Cause created successfully!");
      router.push("/causes");
    } catch (error) {
      console.error("Error creating cause:", error);
      const message =
        error instanceof Error ? error.message : "Error creating cause";
      toast.error(message);
    }
  };

  const isLoading = isPending || isConfirming;

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
              <RichTextEditor
                value={description}
                onChange={setDescription}
                disabled={isLoading}
              />
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

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !writeContract}
            >
              {isLoading ? "Creating..." : "Create Cause"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
