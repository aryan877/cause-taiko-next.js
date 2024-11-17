import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifyMessage } from "viem";
import { createPublicClient, http } from "viem";
import { taikoHekla } from "@/app/chains";
import { contractConfig } from "@/lib/utils";

const publicClient = createPublicClient({
  chain: taikoHekla,
  transport: http(),
});

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const { signature, isFeatured } = await request.json();

    // Read contract owner directly from the contract
    const contractOwner = (await publicClient.readContract({
      ...contractConfig,
      functionName: "owner",
    })) as `0x${string}`;

    if (!contractOwner) {
      return NextResponse.json(
        { error: "Failed to fetch contract owner" },
        { status: 500 }
      );
    }

    // Verify the signature
    const isValid = await verifyMessage({
      message: `Feature cause: ${params.id}`,
      signature: signature as `0x${string}`,
      address: contractOwner,
    });

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const causeIdBuffer = Buffer.from(params.id, "hex");

    // Update the cause
    await prisma.taiko_hekla_testnet_cause_created.updateMany({
      where: {
        cause_id: causeIdBuffer,
      },
      data: {
        is_featured: isFeatured,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error featuring cause:", error);
    return NextResponse.json(
      { error: "Failed to feature cause" },
      { status: 500 }
    );
  }
}
