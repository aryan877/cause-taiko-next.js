"use client";

import { CausesList } from "@/components/causes-list";
import { WalletConnect } from "@/components/wallet-connect";

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Transparent Donations</h1>
        <WalletConnect />
      </div>

      <section className="my-12">
        <h2 className="text-2xl font-semibold mb-6">Active Causes</h2>
        <CausesList />
      </section>
    </main>
  );
}
