import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const sortBy = searchParams.get("sortBy") || "recent";
  const limit = 20;

  try {
    const causeIdBuffer = Buffer.from(params.id, "hex");

    const updates =
      await prisma.taiko_hekla_testnet_beneficiary_update.findMany({
        where: {
          cause_id: causeIdBuffer,
        },
        take: limit,
        ...(cursor
          ? {
              skip: 1,
              cursor: {
                id: Buffer.from(cursor, "hex"),
              },
            }
          : {}),
        orderBy: {
          ...(sortBy === "likes"
            ? { likes_count: "desc" }
            : { block_timestamp: "desc" }),
        },
      });

    const formattedUpdates = updates.map((update) => ({
      id: update.id.toString("hex"),
      causeId: update.cause_id.toString("hex"),
      beneficiary: update.beneficiary.toString("hex"),
      content: update.content,
      likesCount: update.likes_count,
      timestamp: Number(update.block_timestamp),
    }));

    const nextCursor =
      updates.length === limit
        ? updates[updates.length - 1].id.toString("hex")
        : null;

    return NextResponse.json({
      items: formattedUpdates,
      nextCursor,
    });
  } catch (error) {
    console.error("Error fetching updates:", error);
    return NextResponse.json(
      { error: "Failed to fetch updates" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const { content, beneficiary } = await request.json();

    // Verify beneficiary is the actual cause beneficiary
    const causeIdBuffer = Buffer.from(params.id, "hex");
    const beneficiaryBuffer = Buffer.from(beneficiary.replace("0x", ""), "hex");

    const cause = await prisma.taiko_hekla_testnet_cause_created.findFirst({
      where: {
        cause_id: causeIdBuffer,
        beneficiary: beneficiaryBuffer,
      },
    });

    if (!cause) {
      return NextResponse.json(
        { error: "Not authorized to post updates" },
        { status: 403 }
      );
    }

    const update = await prisma.taiko_hekla_testnet_beneficiary_update.create({
      data: {
        id: Buffer.from(uuidv4().replace(/-/g, ""), "hex"),
        cause_id: causeIdBuffer,
        beneficiary: beneficiaryBuffer,
        content,
        block_timestamp: Math.floor(Date.now() / 1000).toString(),
        transaction_hash: Buffer.from(""),
        vid: 0,
        block: 0,
        gs_chain: "taiko",
        gs_gid: "0",
      },
    });

    return NextResponse.json({
      id: update.id.toString("hex"),
      causeId: update.cause_id.toString("hex"),
      beneficiary: update.beneficiary.toString("hex"),
      content: update.content,
      likesCount: 0,
      timestamp: Number(update.block_timestamp),
    });
  } catch (error) {
    console.error("Error creating update:", error);
    return NextResponse.json(
      { error: "Failed to create update" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const updateId = searchParams.get("updateId");
    const beneficiary = searchParams.get("beneficiary");

    if (!updateId || !beneficiary) {
      return NextResponse.json(
        { error: "Missing updateId or beneficiary" },
        { status: 400 }
      );
    }

    const updateIdBuffer = Buffer.from(updateId, "hex");
    const beneficiaryBuffer = Buffer.from(beneficiary.replace("0x", ""), "hex");

    // Verify the beneficiary owns the update
    const update =
      await prisma.taiko_hekla_testnet_beneficiary_update.findFirst({
        where: {
          id: updateIdBuffer,
          beneficiary: beneficiaryBuffer,
        },
      });

    if (!update) {
      return NextResponse.json(
        { error: "Update not found or unauthorized" },
        { status: 403 }
      );
    }

    await prisma.taiko_hekla_testnet_beneficiary_update.delete({
      where: {
        id: updateIdBuffer,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting update:", error);
    return NextResponse.json(
      { error: "Failed to delete update" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { updateId, action } = body;

    if (!updateId || !action) {
      return NextResponse.json(
        { error: "Missing updateId or action" },
        { status: 400 }
      );
    }

    const updateIdBuffer = Buffer.from(updateId, "hex");

    if (action === "like") {
      await prisma.taiko_hekla_testnet_beneficiary_update.update({
        where: {
          id: updateIdBuffer,
        },
        data: {
          likes_count: {
            increment: 1,
          },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating update:", error);
    return NextResponse.json(
      { error: "Failed to update update" },
      { status: 500 }
    );
  }
}
