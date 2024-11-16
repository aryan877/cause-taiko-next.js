import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";

  try {
    const causes = await prisma.taiko_hekla_testnet_cause_created.findMany({
      where: {
        cause_name: {
          contains: query,
          mode: "insensitive",
        },
      },
      take: 5,
      orderBy: {
        block_timestamp: "desc",
      },
    });

    const causesWithDonations = await Promise.all(
      causes.map(async (cause) => {
        const donations =
          await prisma.taiko_hekla_testnet_donation_received.findMany({
            where: {
              cause_id: cause.cause_id,
            },
          });
        return {
          id: cause.id.toString("hex"),
          causeId: cause.cause_id.toString("hex"),
          name: cause.cause_name,
          description: cause.description,
          targetAmount: cause.target_amount.toString(),
          beneficiary: cause.beneficiary.toString("hex"),
          createdAt: new Date(Number(cause.block_timestamp)),
          donations: donations.map((d) => ({
            id: d.id.toString("hex"),
            amount: d.amount.toString(),
            donor: d.donor.toString("hex"),
            timestamp: new Date(Number(d.block_timestamp)),
            causeId: cause.cause_id.toString("hex"),
            causeName: cause.cause_name,
            impactScore: Number(d.impact_score) || 0,
          })),
          withdrawals: [],
          milestones: [],
        };
      })
    );

    return NextResponse.json({ items: causesWithDonations });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}
