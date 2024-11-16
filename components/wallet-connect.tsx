"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { toast } from "sonner";
import { taikoHekla, getTaikoAddChainParameters } from "@/app/chains";

export function WalletConnect() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleConnect = async () => {
    try {
      const connector = connectors[0];
      await connect({ connector });

      if (chain?.id !== taikoHekla.id) {
        try {
          await switchChain({ chainId: taikoHekla.id });
        } catch {
          if (typeof window !== "undefined" && window.ethereum) {
            try {
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [getTaikoAddChainParameters()],
              });
              await switchChain({ chainId: taikoHekla.id });
            } catch (error) {
              toast.error("Failed to add Taiko Hekla network");
              console.error("Failed to add network:", error);
            }
          }
        }
      }
    } catch (error) {
      toast.error("Failed to connect wallet");
      console.error("Failed to connect wallet:", error);
    }
  };

  if (!mounted) {
    return null;
  }

  if (isConnected && address) {
    return (
      <div className="flex gap-2 items-center">
        {chain?.id !== taikoHekla.id && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => switchChain({ chainId: taikoHekla.id })}
          >
            Switch to Taiko
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={() => disconnect()}>
          {address.slice(0, 6)}...{address.slice(-4)}
        </Button>
      </div>
    );
  }

  return (
    <Button size="sm" onClick={handleConnect}>
      Connect Wallet
    </Button>
  );
}
