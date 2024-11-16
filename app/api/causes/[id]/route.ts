import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { notFound } from "next/navigation";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const causeIdBuffer = Buffer.from(params.id, "hex");

    const cause = await prisma.taiko_hekla_testnet_cause_created.findFirst({
      where: {
        cause_id: causeIdBuffer,
      },
    });

    if (!cause) {
      return notFound();
    }

    const [donations, withdrawals, milestones] = await Promise.all([
      prisma.taiko_hekla_testnet_donation_received.findMany({
        where: {
          cause_id: cause.cause_id,
        },
        orderBy: {
          block_timestamp: "desc",
        },
      }),
      prisma.taiko_hekla_testnet_funds_withdrawn.findMany({
        where: {
          cause_id: cause.cause_id,
        },
        orderBy: {
          block_timestamp: "desc",
        },
      }),
      prisma.taiko_hekla_testnet_milestone_completed.findMany({
        where: {
          cause_id: cause.cause_id,
        },
        orderBy: {
          block_timestamp: "desc",
        },
      }),
    ]);

    return NextResponse.json({
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
        impactScore: d.impact_score.toString(),
      })),
      withdrawals: withdrawals.map((w) => ({
        id: w.id.toString("hex"),
        amount: w.amount.toString(),
        timestamp: Number(w.block_timestamp),
      })),
      milestones: milestones.map((m) => ({
        id: m.id.toString("hex"),
        index: m.milestone_index.toString(),
        completionTime: Number(m.completion_time),
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch cause details" },
      { status: 500 }
    );
  }
}
