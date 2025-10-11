export interface PlanLimits {
  mealScansPerMonth: number;
  aiChatTokensPerMonth: number | null;
  aiChatMessagesEstimate: number | null;
  hasQuestionnaireAccess: boolean;
  questionnaireRetentionDays: number | null;
  name: string;
  description: string;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  FREE: {
    mealScansPerMonth: 5,
    aiChatTokensPerMonth: null,
    aiChatMessagesEstimate: null,
    hasQuestionnaireAccess: true,
    questionnaireRetentionDays: 7,
    name: "Free Plan",
    description: "Basic features to get started",
  },
  GOLD: {
    mealScansPerMonth: 100,
    aiChatTokensPerMonth: null,
    aiChatMessagesEstimate: 100,
    hasQuestionnaireAccess: true,
    questionnaireRetentionDays: null,
    name: "Gold Plan",
    description: "Full features with generous limits",
  },
  PLATINUM: {
    mealScansPerMonth: 50,
    aiChatTokensPerMonth: 1000,
    aiChatMessagesEstimate: 20,
    hasQuestionnaireAccess: true,
    questionnaireRetentionDays: null,
    name: "Platinum Plan",
    description: "Premium AI experience",
  },
};

export function getPlanLimit(
  subscriptionType: string,
  limitType: keyof PlanLimits
): number | boolean | null | string {
  const plan = PLAN_LIMITS[subscriptionType] || PLAN_LIMITS.FREE;
  return plan[limitType];
}

export function getPlanLimits(subscriptionType: string): PlanLimits {
  return PLAN_LIMITS[subscriptionType] || PLAN_LIMITS.FREE;
}

export function canAccessAIChat(subscriptionType: string): boolean {
  return subscriptionType === "GOLD" || subscriptionType === "PLATINUM";
}

export function canAccessFullQuestionnaire(subscriptionType: string): boolean {
  return subscriptionType === "GOLD" || subscriptionType === "PLATINUM";
}
