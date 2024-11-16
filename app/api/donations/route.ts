import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address")?.toLowerCase();
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 });
  }

  try {
    const addressBuffer = Buffer.from(address.replace("0x", ""), "hex");

    // Get total count for pagination
    const [donationsCount, badgesCount] = await Promise.all([
      prisma.taiko_hekla_testnet_donation_received.count({
        where: { donor: addressBuffer },
      }),
      prisma.taiko_hekla_testnet_badge_earned.count({
        where: { donor: addressBuffer },
      }),
    ]);

    const total = donationsCount + badgesCount;
    const totalPages = Math.ceil(total / limit);

    // Fetch paginated donations and badges
    const [donations, badges] = await Promise.all([
      prisma.taiko_hekla_testnet_donation_received.findMany({
        where: { donor: addressBuffer },
        orderBy: { block_timestamp: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          donor: true,
          cause_id: true,
          cause_name: true,
          amount: true,
          impact_score: true,
          block_timestamp: true,
          transaction_hash: true,
        },
      }),
      prisma.taiko_hekla_testnet_badge_earned.findMany({
        where: { donor: addressBuffer },
        orderBy: { block_timestamp: "desc" },
        skip: Math.max(0, skip - donationsCount),
        take: limit,
        select: {
          id: true,
          donor: true,
          badge_type: true,
          block_timestamp: true,
          transaction_hash: true,
        },
      }),
    ]);

    // Combine and format activities
    const activities = [
      ...donations.map((d) => ({
        id: d.id.toString("hex"),
        type: "donation" as const,
        timestamp: Number(d.block_timestamp),
        amount: d.amount.toString(),
        donor: d.donor.toString("hex"),
        causeId: d.cause_id.toString("hex"),
        causeName: d.cause_name,
        impactScore: d.impact_score.toString(),
        transactionHash: d.transaction_hash.toString("hex"),
      })),
      ...badges.map((b) => ({
        id: b.id.toString("hex"),
        type: "badge" as const,
        timestamp: Number(b.block_timestamp),
        donor: b.donor.toString("hex"),
        badgeType: b.badge_type,
        transactionHash: b.transaction_hash.toString("hex"),
        causeId: "",
        causeName: "",
      })),
    ].sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json({
      items: activities,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error("Failed to fetch donations:", error);
    return NextResponse.json(
      { error: "Failed to fetch donations" },
      { status: 500 }
    );
  }
}
