import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import contractABI from "@/ABI.json";
import { http, createConfig } from "@wagmi/core";
import { taikoHekla } from "@/app/chains";
import { injected } from "wagmi/connectors";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const contractConfig = {
  address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
  abi: contractABI.abi,
} as const;

export const config = createConfig({
  chains: [taikoHekla],
  connectors: [injected()],
  ssr: true,
  transports: {
    [taikoHekla.id]: http(),
  },
});
