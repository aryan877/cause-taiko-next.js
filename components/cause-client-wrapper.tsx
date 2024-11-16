"use client";

import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { DonateCauseDialog } from "@/components/donate-dialog";
import { Cause } from "@/types";

interface CauseClientWrapperProps {
  cause: Cause;
}

export function CauseClientWrapper({ cause }: CauseClientWrapperProps) {
  const { isConnected } = useAccount();

  return (
    <DonateCauseDialog cause={cause}>
      <Button className="w-full" size="lg" disabled={!isConnected}>
        {isConnected ? "Donate Now" : "Connect Wallet to Donate"}
      </Button>
    </DonateCauseDialog>
  );
}
