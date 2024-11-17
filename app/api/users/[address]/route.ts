import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request, props: { params: Promise<{ address: string }> }) {
  const params = await props.params;
  try {
    const addressBuffer = Buffer.from(params.address.replace("0x", ""), "hex");

    // Fetch all user data in parallel
    const [donations, badges, impactScores] = await Promise.all([
      // Get all donations
      prisma.taiko_hekla_testnet_donation_received.findMany({
        where: { donor: addressBuffer },
        orderBy: { block_timestamp: "desc" },
      }),
      // Get all badges
      prisma.taiko_hekla_testnet_badge_earned.findMany({
        where: { donor: addressBuffer },
        orderBy: { block_timestamp: "desc" },
      }),
      // Get impact scores
      prisma.taiko_hekla_testnet_impact_score_updated.findMany({
        where: { donor: addressBuffer },
        orderBy: { block_timestamp: "desc" },
        take: 1,
      }),
    ]);

    // Calculate total donated and unique causes
    const totalDonated = donations.reduce(
      (acc, curr) => acc + BigInt(curr.amount.toString()),
      BigInt(0)
    );
    const uniqueCauses = new Set(
      donations.map((d) => d.cause_id.toString("hex"))
    );

    const profile = {
      address: params.address,
      totalDonated: totalDonated.toString(),
      donationCount: donations.length,
      causesSupported: uniqueCauses.size,
      impactScore: impactScores[0]?.new_score.toString() || "0",
      badges: badges.map((badge) => ({
        type: badge.badge_type,
        earnedAt: Number(badge.block_timestamp),
        transactionHash: badge.transaction_hash.toString("hex"),
      })),
      donations: donations.map((donation) => ({
        id: donation.id.toString("hex"),
        amount: donation.amount.toString(),
        causeId: donation.cause_id.toString("hex"),
        causeName: donation.cause_name,
        timestamp: Number(donation.block_timestamp),
        transactionHash: donation.transaction_hash.toString("hex"),
        impactScore: donation.impact_score.toString(),
      })),
    };

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}
