import { prisma } from "../lib/database";
import { PLAN_LIMITS } from "../config/planLimits";

export class UsageTrackingService {
  static async checkAndResetIfNeeded(userId: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { user_id: userId },
        select: {
          meal_scans_reset_at: true,
          ai_chat_tokens_reset_at: true,
        },
      });

      if (!user) return;

      const now = new Date();
      const updates: any = {};

      if (this.shouldResetMonthlyCounter(user.meal_scans_reset_at, now)) {
        updates.meal_scans_count = 0;
        updates.meal_scans_reset_at = now;
      }

      if (this.shouldResetMonthlyCounter(user.ai_chat_tokens_reset_at, now)) {
        updates.ai_chat_tokens_used = 0;
        updates.ai_chat_tokens_reset_at = now;
      }

      if (Object.keys(updates).length > 0) {
        await prisma.user.update({
          where: { user_id: userId },
          data: updates,
        });
        console.log(`✅ Reset usage counters for user ${userId}`);
      }
    } catch (error) {
      console.error("Error checking/resetting usage:", error);
    }
  }

  private static shouldResetMonthlyCounter(
    lastResetDate: Date,
    now: Date
  ): boolean {
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return lastResetDate < oneMonthAgo;
  }

  static async checkMealScanLimit(userId: string): Promise<{
    allowed: boolean;
    current: number;
    limit: number;
    remaining: number;
    message?: string;
  }> {
    await this.checkAndResetIfNeeded(userId);

    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: {
        subscription_type: true,
        meal_scans_count: true,
      },
    });

    if (!user) {
      return {
        allowed: false,
        current: 0,
        limit: 0,
        remaining: 0,
        message: "User not found",
      };
    }

    const planLimits = PLAN_LIMITS[user.subscription_type] || PLAN_LIMITS.FREE;
    const limit = planLimits.mealScansPerMonth;
    const current = user.meal_scans_count;
    const remaining = Math.max(0, limit - current);

    if (current >= limit) {
      return {
        allowed: false,
        current,
        limit,
        remaining: 0,
        message: `You have reached your monthly limit of ${limit} meal scans. Upgrade your plan for more scans.`,
      };
    }

    return {
      allowed: true,
      current,
      limit,
      remaining,
    };
  }

  static async incrementMealScanCount(userId: string): Promise<void> {
    await prisma.user.update({
      where: { user_id: userId },
      data: {
        meal_scans_count: {
          increment: 1,
        },
      },
    });
  }

  static async checkAIChatLimit(
    userId: string,
    estimatedTokens: number = 100
  ): Promise<{
    allowed: boolean;
    current: number;
    limit: number | null;
    remaining: number | null;
    message?: string;
  }> {
    await this.checkAndResetIfNeeded(userId);

    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: {
        subscription_type: true,
        ai_chat_tokens_used: true,
      },
    });

    if (!user) {
      return {
        allowed: false,
        current: 0,
        limit: 0,
        remaining: 0,
        message: "User not found",
      };
    }

    if (user.subscription_type === "FREE") {
      return {
        allowed: false,
        current: 0,
        limit: 0,
        remaining: 0,
        message:
          "AI Chat is not available on the Free plan. Please upgrade to Gold or PREMIUM plan.",
      };
    }

    const planLimits = PLAN_LIMITS[user.subscription_type] || PLAN_LIMITS.FREE;

    if (user.subscription_type === "GOLD") {
      const messagesLimit = planLimits.aiChatMessagesEstimate || 100;
      const currentMessages = Math.floor(user.ai_chat_tokens_used / 100);
      const remaining = Math.max(0, messagesLimit - currentMessages);

      if (currentMessages >= messagesLimit) {
        return {
          allowed: false,
          current: currentMessages,
          limit: messagesLimit,
          remaining: 0,
          message: `You have reached your monthly limit of ${messagesLimit} AI chat messages. Upgrade to PREMIUM for more messages.`,
        };
      }

      return {
        allowed: true,
        current: currentMessages,
        limit: messagesLimit,
        remaining,
      };
    }

    if (user.subscription_type === "PREMIUM") {
      const tokensLimit = planLimits.aiChatTokensPerMonth || 1000;
      const current = user.ai_chat_tokens_used;
      const remaining = Math.max(0, tokensLimit - current);

      if (current + estimatedTokens > tokensLimit) {
        return {
          allowed: false,
          current,
          limit: tokensLimit,
          remaining,
          message: `You have reached your monthly limit of ${tokensLimit} AI chat tokens. Your limit will reset next month.`,
        };
      }

      return {
        allowed: true,
        current,
        limit: tokensLimit,
        remaining,
      };
    }

    return {
      allowed: false,
      current: 0,
      limit: 0,
      remaining: 0,
      message: "Unknown subscription type",
    };
  }

  static async incrementAIChatTokens(
    userId: string,
    tokensUsed: number
  ): Promise<void> {
    await prisma.user.update({
      where: { user_id: userId },
      data: {
        ai_chat_tokens_used: {
          increment: tokensUsed,
        },
      },
    });
  }

  static async getUserUsageStats(userId: string): Promise<{
    subscriptionType: string;
    mealScans: {
      current: number;
      limit: number;
      remaining: number;
      resetDate: Date;
    };
    aiChat: {
      current: number;
      limit: number | null;
      remaining: number | null;
      resetDate: Date;
      messagesEstimate?: number;
    };
  }> {
    await this.checkAndResetIfNeeded(userId);

    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: {
        subscription_type: true,
        meal_scans_count: true,
        meal_scans_reset_at: true,
        ai_chat_tokens_used: true,
        ai_chat_tokens_reset_at: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const planLimits = PLAN_LIMITS[user.subscription_type] || PLAN_LIMITS.FREE;

    const mealScansLimit = planLimits.mealScansPerMonth;
    const mealScansRemaining = Math.max(
      0,
      mealScansLimit - user.meal_scans_count
    );

    let aiChatLimit: number | null = null;
    let aiChatRemaining: number | null = null;
    let messagesEstimate: number | undefined;

    if (user.subscription_type === "GOLD") {
      messagesEstimate = planLimits.aiChatMessagesEstimate || 100;
      const currentMessages = Math.floor(user.ai_chat_tokens_used / 100);
      aiChatLimit = messagesEstimate;
      aiChatRemaining = Math.max(0, messagesEstimate - currentMessages);
    } else if (user.subscription_type === "PREMIUM") {
      aiChatLimit = planLimits.aiChatTokensPerMonth || 1000;
      aiChatRemaining = Math.max(0, aiChatLimit - user.ai_chat_tokens_used);
      messagesEstimate = planLimits.aiChatMessagesEstimate || 20;
    }

    return {
      subscriptionType: user.subscription_type,
      mealScans: {
        current: user.meal_scans_count,
        limit: mealScansLimit,
        remaining: mealScansRemaining,
        resetDate: user.meal_scans_reset_at,
      },
      aiChat: {
        current: user.ai_chat_tokens_used,
        limit: aiChatLimit,
        remaining: aiChatRemaining,
        resetDate: user.ai_chat_tokens_reset_at,
        messagesEstimate,
      },
    };
  }
}
