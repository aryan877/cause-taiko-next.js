import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const causeIdBuffer = Buffer.from(params.id, "hex");

    const [commentsCount, updatesCount] = await Promise.all([
      prisma.taiko_hekla_testnet_comment.count({
        where: {
          cause_id: causeIdBuffer,
        },
      }),
      prisma.taiko_hekla_testnet_beneficiary_update.count({
        where: {
          cause_id: causeIdBuffer,
        },
      }),
    ]);

    return NextResponse.json({
      comments: commentsCount,
      updates: updatesCount,
    });
  } catch (error) {
    console.error("Error fetching counts:", error);
    return NextResponse.json(
      { error: "Failed to fetch counts" },
      { status: 500 }
    );
  }
}
