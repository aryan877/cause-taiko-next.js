import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

  try {
    const donations =
      await prisma.taiko_hekla_testnet_donation_received.groupBy({
        by: ["donor"],
        _sum: {
          amount: true,
        },
        _count: {
          amount: true,
        },
        orderBy: {
          _sum: {
            amount: "desc",
          },
        },
        take: limit,
        skip: skip,
      });

    const totalDonors =
      await prisma.taiko_hekla_testnet_donation_received.groupBy({
        by: ["donor"],
        _count: true,
      });

    return NextResponse.json({
      items: donations.map((donor) => ({
        address: donor.donor.toString("hex"),
        totalDonated: donor._sum.amount?.toString() || "0",
        donationCount: donor._count.amount,
      })),
      total: totalDonors.length,
      page,
      limit,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
