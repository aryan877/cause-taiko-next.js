import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import contractABI from "@/ABI.json";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const contractConfig = {
  address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
  abi: contractABI.abi,
} as const;
