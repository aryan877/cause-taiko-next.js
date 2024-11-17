"use client";

import { CausesList } from "@/components/causes-list";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles, Target, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-500/20 -z-10" />
        <div className="container mx-auto px-4 py-16">
          <div className="flex justify-between items-center">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                CauseTaiko
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl">
                Empowering transparent and impactful donations on Taiko L2.
                Support causes, track impact, and build a better future
                together.
              </p>
              <div className="flex gap-4 pt-4">
                <Button size="lg" className="gap-2">
                  <Heart className="w-5 h-5" />
                  Donate Now
                </Button>
                <Link href="/leaderboard">
                  <Button variant="outline" size="lg" className="gap-2">
                    <TrendingUp className="w-5 h-5" />
                    View Top Donors
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="flex items-start gap-4 p-6 rounded-lg bg-gradient-to-br from-pink-50 to-white dark:from-pink-950 dark:to-background">
            <div className="p-3 rounded-full bg-pink-100 dark:bg-pink-900">
              <Target className="w-6 h-6 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Transparent Impact</h3>
              <p className="text-sm text-muted-foreground">
                Track your donations and see their real-world impact through
                verified milestones.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-6 rounded-lg bg-gradient-to-br from-purple-50 to-white dark:from-purple-950 dark:to-background">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
              <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Earn Rewards</h3>
              <p className="text-sm text-muted-foreground">
                Get recognized for your generosity with badges and climb the
                donor leaderboard.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-6 rounded-lg bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-background">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Scale with Taiko</h3>
              <p className="text-sm text-muted-foreground">
                Benefit from fast and low-cost transactions on Taiko L2 network.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <CausesList />
        </div>
      </div>
    </main>
  );
}
