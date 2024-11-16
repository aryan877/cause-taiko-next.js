import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { notFound } from "next/navigation";

function calculateDonationStats(donations: any[]) {
  const hourlyStats = new Map();
  const dailyStats = new Map();
  const monthlyStats = new Map();

  donations.forEach((donation) => {
    const timestamp = Number(donation.block_timestamp);
    const amount = BigInt(donation.amount.toString());

    // Hourly stats
    const hourKey = Math.floor(timestamp / 3600) * 3600;
    const existingHourAmount = hourlyStats.get(hourKey) || BigInt(0);
    hourlyStats.set(hourKey, existingHourAmount + amount);

    // Daily stats
    const dayKey = Math.floor(timestamp / 86400) * 86400;
    const existingDayAmount = dailyStats.get(dayKey) || BigInt(0);
    dailyStats.set(dayKey, existingDayAmount + amount);

    // Monthly stats
    const date = new Date(timestamp * 1000);
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const existingMonthAmount = monthlyStats.get(monthKey) || BigInt(0);
    monthlyStats.set(monthKey, existingMonthAmount + amount);
  });

  return {
    hourly: Array.from(hourlyStats.entries()).map(([timestamp, amount]) => ({
      timestamp,
      amount: amount.toString(),
    })),
    daily: Array.from(dailyStats.entries()).map(([timestamp, amount]) => ({
      timestamp,
      amount: amount.toString(),
    })),
    monthly: Array.from(monthlyStats.entries()).map(([month, amount]) => ({
      month,
      amount: amount.toString(),
    })),
  };
}

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

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

    const [
      donations,
      withdrawals,
      milestones,
      donationsCount,
      withdrawalsCount,
    ] = await Promise.all([
      prisma.taiko_hekla_testnet_donation_received.findMany({
        where: {
          cause_id: cause.cause_id,
        },
        orderBy: {
          block_timestamp: "desc",
        },
        take: limit,
        skip: skip,
      }),
      prisma.taiko_hekla_testnet_funds_withdrawn.findMany({
        where: {
          cause_id: cause.cause_id,
        },
        orderBy: {
          block_timestamp: "desc",
        },
        take: limit,
        skip: skip,
      }),
      prisma.taiko_hekla_testnet_milestone_completed.findMany({
        where: {
          cause_id: cause.cause_id,
        },
        orderBy: {
          block_timestamp: "desc",
        },
      }),
      prisma.taiko_hekla_testnet_donation_received.count({
        where: {
          cause_id: cause.cause_id,
        },
      }),
      prisma.taiko_hekla_testnet_funds_withdrawn.count({
        where: {
          cause_id: cause.cause_id,
        },
      }),
    ]);

    const topDonors = donations
      .reduce((acc: { donor: string; total: bigint }[], donation) => {
        const donorIndex = acc.findIndex(
          (d) => d.donor === donation.donor.toString("hex")
        );
        const amount = BigInt(donation.amount.toString());

        if (donorIndex === -1) {
          acc.push({ donor: donation.donor.toString("hex"), total: amount });
        } else {
          acc[donorIndex].total += amount;
        }

        return acc;
      }, [])
      .sort((a, b) => (b.total > a.total ? 1 : -1))
      .slice(0, 5)
      .map((donor) => ({
        address: donor.donor,
        totalDonated: donor.total.toString(),
        donationCount: donations.filter(
          (d) => d.donor.toString("hex") === donor.donor
        ).length,
      }));

    // Calculate remaining withdrawable amount
    const totalDonated = donations.reduce(
      (acc, donation) => acc + BigInt(donation.amount.toString()),
      BigInt(0)
    );

    const totalWithdrawn = withdrawals.reduce(
      (acc, withdrawal) => acc + BigInt(withdrawal.amount.toString()),
      BigInt(0)
    );

    const remainingAmount = totalDonated - totalWithdrawn;

    const donationStats = calculateDonationStats(donations);

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
      topDonors,
      donations: donations.map((d) => ({
        id: d.id.toString("hex"),
        amount: d.amount.toString(),
        donor: d.donor.toString("hex"),
        timestamp: Number(d.block_timestamp),
        impactScore: d.impact_score.toString(),
        transactionHash: d.transaction_hash.toString("hex"),
      })),
      withdrawals: withdrawals.map((w) => ({
        id: w.id.toString("hex"),
        amount: w.amount.toString(),
        timestamp: Number(w.block_timestamp),
        transactionHash: w.transaction_hash.toString("hex"),
        beneficiary: cause.beneficiary.toString("hex"),
      })),
      milestones: milestones.map((m) => ({
        id: m.id.toString("hex"),
        index: m.milestone_index.toString(),
        completionTime: Number(m.completion_time),
        transactionHash: m.transaction_hash.toString("hex"),
      })),
      totalDonated: totalDonated.toString(),
      totalWithdrawn: totalWithdrawn.toString(),
      remainingAmount: remainingAmount.toString(),
      stats: {
        donationStats,
        averageDonation:
          donations.length > 0
            ? (totalDonated / BigInt(donations.length)).toString()
            : "0",
        peakHourlyDonation: Math.max(
          ...donationStats.hourly.map((stat) => Number(stat.amount))
        ).toString(),
        peakDailyDonation: Math.max(
          ...donationStats.daily.map((stat) => Number(stat.amount))
        ).toString(),
        donationFrequency:
          donations.length > 0
            ? Math.floor(
                (Date.now() / 1000 - Number(cause.block_timestamp)) /
                  donations.length
              )
            : 0,
        recentTrend: donationStats.daily
          .slice(-7)
          .map((stat) => ({ timestamp: stat.timestamp, amount: stat.amount })),
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch cause details" },
      { status: 500 }
    );
  }
}
