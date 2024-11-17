import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { PaginatedCauses } from "@/types";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "9");
  const search = searchParams.get("search") || "";
  const featuredOnly = searchParams.get("featured") === "true";
  const skip = (page - 1) * limit;

  try {
    const where: Prisma.taiko_hekla_testnet_cause_createdWhereInput = {
      cause_name: {
        contains: search,
        mode: "insensitive" as Prisma.QueryMode,
      },
      ...(featuredOnly ? { is_featured: true } : {}),
    };

    const [causes, total] = await Promise.all([
      prisma.taiko_hekla_testnet_cause_created.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ is_featured: "desc" }, { block_timestamp: "desc" }],
      }),
      prisma.taiko_hekla_testnet_cause_created.count({ where }),
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
          isFeatured: cause.is_featured,
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
