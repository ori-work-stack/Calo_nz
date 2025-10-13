export interface PlanLimits {
  mealScansPerMonth: number;
  aiChatTokensPerMonth: number | null;
  aiChatMessagesEstimate: number | null;
  hasQuestionnaireAccess: boolean;
  questionnaireRetentionDays: number | null;
  aiRecommendationsPerWeek: number; // 0 = none, 1 = weekly, 7 = daily
  dailyGoalsPerWeek: number; // 0 = none, 1 = weekly, 7 = daily
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
    aiRecommendationsPerWeek: 0, // No AI recommendations
    dailyGoalsPerWeek: 0, // No daily goals
    name: "Free Plan",
    description: "Basic features to get started",
  },
  GOLD: {
    mealScansPerMonth: 100,
    aiChatTokensPerMonth: null,
    aiChatMessagesEstimate: 100,
    hasQuestionnaireAccess: true,
    questionnaireRetentionDays: null,
    aiRecommendationsPerWeek: 7, // Daily AI recommendations
    dailyGoalsPerWeek: 7, // Daily goals every day
    name: "Gold Plan",
    description: "Full features with generous limits",
  },
  PLATINUM: {
    mealScansPerMonth: 50,
    aiChatTokensPerMonth: 1000,
    aiChatMessagesEstimate: 20,
    hasQuestionnaireAccess: true,
    questionnaireRetentionDays: null,
    aiRecommendationsPerWeek: 1, // Weekly AI recommendations
    dailyGoalsPerWeek: 1, // Weekly daily goals
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

export function canReceiveAIRecommendations(subscriptionType: string): boolean {
  const plan = PLAN_LIMITS[subscriptionType] || PLAN_LIMITS.FREE;
  return plan.aiRecommendationsPerWeek > 0;
}

export function canReceiveDailyGoals(subscriptionType: string): boolean {
  const plan = PLAN_LIMITS[subscriptionType] || PLAN_LIMITS.FREE;
  return plan.dailyGoalsPerWeek > 0;
}

export function shouldCreateAIRecommendationToday(
  subscriptionType: string,
  signupDate: Date,
  today: Date = new Date()
): boolean {
  const plan = PLAN_LIMITS[subscriptionType] || PLAN_LIMITS.FREE;

  if (plan.aiRecommendationsPerWeek === 0) return false;
  if (plan.aiRecommendationsPerWeek === 7) return true; // Daily

  // Weekly - check if today matches signup day
  const signupDayOfWeek = signupDate.getDay();
  const todayDayOfWeek = today.getDay();
  return todayDayOfWeek === signupDayOfWeek;
}

export function shouldCreateDailyGoalToday(
  subscriptionType: string,
  signupDate: Date,
  today: Date = new Date()
): boolean {
  const plan = PLAN_LIMITS[subscriptionType] || PLAN_LIMITS.FREE;

  if (plan.dailyGoalsPerWeek === 0) return false;
  if (plan.dailyGoalsPerWeek === 7) return true; // Daily

  // Weekly - check if today matches signup day
  const signupDayOfWeek = signupDate.getDay();
  const todayDayOfWeek = today.getDay();
  return todayDayOfWeek === signupDayOfWeek;
}
