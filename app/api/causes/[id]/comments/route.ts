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
  const limit = 20;

  try {
    const causeIdBuffer = Buffer.from(params.id, "hex");

    // Fetch top-level comments first
    const comments = await prisma.taiko_hekla_testnet_comment.findMany({
      where: {
        cause_id: causeIdBuffer,
        parent_id: null,
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
        block_timestamp: "desc",
      },
    });

    // Get all replies for these comments
    const commentIds = comments.map((c) => c.id);
    const replies = await prisma.taiko_hekla_testnet_comment.findMany({
      where: {
        parent_id: {
          in: commentIds,
        },
      },
      orderBy: {
        block_timestamp: "desc",
      },
    });

    const formattedComments = comments.map((comment) => ({
      id: comment.id.toString("hex"),
      causeId: comment.cause_id.toString("hex"),
      author: comment.author.toString("hex"),
      content: comment.content,
      likesCount: comment.likes_count,
      timestamp: Number(comment.block_timestamp),
      replies: replies
        .filter((r) => r.parent_id?.equals(comment.id))
        .map((reply) => ({
          id: reply.id.toString("hex"),
          causeId: reply.cause_id.toString("hex"),
          author: reply.author.toString("hex"),
          content: reply.content,
          likesCount: reply.likes_count,
          timestamp: Number(reply.block_timestamp),
          parentId: reply.parent_id?.toString("hex"),
        })),
    }));

    const nextCursor =
      comments.length === limit
        ? comments[comments.length - 1].id.toString("hex")
        : null;

    return NextResponse.json({
      items: formattedComments,
      nextCursor,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
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
    const body = await request.json();
    const { content, author, parentId } = body;

    const causeIdBuffer = Buffer.from(params.id, "hex");
    const authorBuffer = Buffer.from(author.replace("0x", ""), "hex");
    const parentIdBuffer = parentId ? Buffer.from(parentId, "hex") : null;

    const comment = await prisma.taiko_hekla_testnet_comment.create({
      data: {
        id: Buffer.from(uuidv4().replace(/-/g, ""), "hex"),
        cause_id: causeIdBuffer,
        author: authorBuffer,
        content,
        parent_id: parentIdBuffer,
        block_timestamp: Math.floor(Date.now() / 1000).toString(),
        transaction_hash: Buffer.from(""),
        vid: 0,
        block: 0,
        gs_chain: "taiko",
        gs_gid: "0",
      },
    });

    return NextResponse.json({
      id: comment.id.toString("hex"),
      causeId: comment.cause_id.toString("hex"),
      author: comment.author.toString("hex"),
      content: comment.content,
      likesCount: 0,
      timestamp: Number(comment.block_timestamp),
      parentId: comment.parent_id?.toString("hex"),
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
