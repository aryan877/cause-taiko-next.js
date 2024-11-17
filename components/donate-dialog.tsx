"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { parseEther } from "viem";
import { useWriteContract } from "wagmi";
import { contractConfig } from "@/lib/utils";
import { toast } from "sonner";
import { Cause } from "@/types";
import { waitForTransactionReceipt } from "@wagmi/core";
import { config } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";

interface DonateCauseDialogProps {
  cause: Cause;
  children: React.ReactNode;
}

export function DonateCauseDialog({ cause, children }: DonateCauseDialogProps) {
  const [amount, setAmount] = useState("");
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { isConnected } = useAccount();

  const { writeContract } = useWriteContract({
    mutation: {
      onMutate: () => {
        return toast.loading("Initiating donation...");
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
              <p>Donation successful!</p>
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

          setOpen(false);
          setAmount("");

          // Reload cause data
          await queryClient.invalidateQueries({
            queryKey: ["cause", cause.causeId],
          });
        } catch {
          toast.error("Failed to process donation", { id: toastId });
        }
      },
      onError: (error, _, toastId) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to process donation",
          { id: toastId }
        );
      },
    },
  });

  const handleDonate = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      if (!writeContract) {
        toast.error("Wallet not connected");
        return;
      }

      await writeContract({
        ...contractConfig,
        functionName: "donate",
        args: [`0x${cause.causeId}`],
        value: parseEther(amount),
      });
    } catch (error) {
      console.error("Error donating:", error);
      toast.error(
        error instanceof Error ? error.message : "Error processing donation"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Donate to {cause.name}</DialogTitle>
          <DialogDescription>
            Enter the amount you would like to donate in ETH. You&apos;ll
            receive impact points and may earn badges based on your total
            donations!
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.0"
              className="col-span-3"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleDonate} disabled={!isConnected || !amount}>
            {!isConnected ? "Wallet not connected" : "Donate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
