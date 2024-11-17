import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const causeId = Buffer.from(params.id, "hex");

    const [milestones, completedMilestones] = await Promise.all([
      prisma.taiko_hekla_testnet_milestone_added.findMany({
        where: {
          cause_id: causeId,
        },
        orderBy: {
          block_timestamp: "asc",
        },
      }),
      prisma.taiko_hekla_testnet_milestone_completed.findMany({
        where: {
          cause_id: causeId,
        },
      }),
    ]);

    const formattedMilestones = milestones.map((milestone, index) => {
      const completed = completedMilestones.find(
        (cm) => Number(cm.milestone_index) === index
      );

      return {
        id: milestone.id.toString("hex"),
        description: milestone.description,
        targetAmount: milestone.target_amount.toString(),
        isCompleted: !!completed,
        completionTime: completed ? Number(completed.completion_time) : null,
        createdAt: Number(milestone.block_timestamp),
        transactionHash: milestone.transaction_hash.toString("hex"),
      };
    });

    return NextResponse.json({ items: formattedMilestones });
  } catch (error) {
    console.error("Error fetching milestones:", error);
    return NextResponse.json(
      { error: "Failed to fetch milestones" },
      { status: 500 }
    );
  }
}
