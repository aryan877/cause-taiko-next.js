import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { PaginatedCauses } from "@/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "9");
  const search = searchParams.get("search") || "";
  const skip = (page - 1) * limit;

  try {
    const [causes, total] = await Promise.all([
      prisma.taiko_hekla_testnet_cause_created.findMany({
        where: {
          cause_name: {
            contains: search,
            mode: "insensitive",
          },
        },
        skip,
        take: limit,
        orderBy: {
          block_timestamp: "desc",
        },
      }),
      prisma.taiko_hekla_testnet_cause_created.count({
        where: {
          cause_name: {
            contains: search,
            mode: "insensitive",
          },
        },
      }),
    ]);

    const causesWithDonations = await Promise.all(
      causes.map(async (cause) => {
        const donations =
          await prisma.taiko_hekla_testnet_donation_received.findMany({
            where: {
              cause_id: cause.cause_id,
            },
            select: {
              id: true,
              amount: true,
              donor: true,
              block_timestamp: true,
              impact_score: true,
              transaction_hash: true,
            },
          });

        return {
          id: cause.id.toString("hex"),
          causeId: cause.cause_id.toString("hex"),
          name: cause.cause_name,
          description: cause.description,
          targetAmount: cause.target_amount.toString(),
          beneficiary: cause.beneficiary.toString("hex"),
          createdAt: Number(cause.block_timestamp),
          timestamp: Number(cause.block_timestamp),
          donationCount: donations.length,
          donations: donations.map((d) => ({
            id: d.id.toString("hex"),
            amount: d.amount.toString(),
            donor: d.donor.toString("hex"),
            timestamp: Number(d.block_timestamp),
            causeId: cause.cause_id.toString("hex"),
            causeName: cause.cause_name,
            impactScore: d.impact_score.toString(),
            transactionHash: d.transaction_hash.toString("hex"),
          })),
          withdrawals: [],
          milestones: [],
        };
      })
    );

    const response: PaginatedCauses = {
      items: causesWithDonations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + causes.length < total,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching causes:", error);
    return NextResponse.json(
      { error: "Failed to fetch causes" },
      { status: 500 }
    );
  }
}
