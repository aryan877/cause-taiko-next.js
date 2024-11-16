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
import {
  useWriteContract,
  useWatchContractEvent,
  useWaitForTransactionReceipt,
} from "wagmi";
import { contractConfig } from "@/lib/utils";
import { toast } from "sonner";
import { Cause } from "@/types";

interface DonateCauseDialogProps {
  cause: Cause;
  children: React.ReactNode;
}

export function DonateCauseDialog({ cause, children }: DonateCauseDialogProps) {
  const [amount, setAmount] = useState("");
  const [open, setOpen] = useState(false);
  const { writeContract, data: hash, isPending } = useWriteContract();

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
  });

  // Only watch for badge events
  useWatchContractEvent({
    ...contractConfig,
    eventName: "BadgeEarned",
    onLogs(logs) {
      if (!hash) return;
      const matchingLog = logs.find((log) => log.transactionHash === hash);
      if (matchingLog && "args" in matchingLog) {
        const [, badgeType] = matchingLog.args as [string, string];
        toast.success(`Congratulations! You earned a ${badgeType} badge! 🏆`);
      }
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

      toast.success("Donation successful!");
      setOpen(false);
      setAmount("");
    } catch (error) {
      console.error("Error donating:", error);
      const message =
        error instanceof Error ? error.message : "Error processing donation";
      toast.error(message);
    }
  };

  const isLoading = isPending || isConfirming;

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
          <Button
            onClick={handleDonate}
            disabled={isLoading || !amount || !writeContract}
          >
            {isLoading ? "Processing..." : "Donate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
