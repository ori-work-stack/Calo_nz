
import { prisma } from "../lib/database";
import { OpenAIService } from "./openai";

export interface MenuAnalytics {
  completion_rate: number;
  popular_meals: Array<{ meal_id: string; name: string; count: number }>;
  avg_daily_completion: number;
  total_check_ins: number;
}

export interface MealCheckIn {
  meal_instance_id: string;
  user_id: string;
  menu_id: string;
  meal_id: string;
  photo_url: string;
  verification_score: number;
  eaten_at: Date;
  notes?: string;
}

export class EnhancedMenuService {
  // Get menu with tracking info
  static async getMenuWithTracking(userId: string, menuId: string) {
    const menu = await prisma.recommendedMenu.findFirst({
      where: { menu_id: menuId, user_id: userId },
      include: {
        meals: {
          include: {
            ingredients: true,
          },
          orderBy: [{ day_number: "asc" }, { meal_type: "asc" }],
        },
      },
    });

    if (!menu) return null;

    // Get check-ins for this menu
    const checkIns = await prisma.mealCompletion.findMany({
      where: { user_id: userId, menu_id: menuId },
      orderBy: { completed_date: "desc" },
    });

    // Calculate analytics
    const analytics = this.calculateMenuAnalytics(menu, checkIns);

    return {
      ...menu,
      check_ins: checkIns,
      analytics,
      total_meals: menu.meals.length,
      completed_meals: checkIns.length,
      completion_percentage: menu.meals.length > 0 
        ? Math.round((checkIns.length / menu.meals.length) * 100) 
        : 0,
    };
  }

  // Calculate menu analytics
  private static calculateMenuAnalytics(menu: any, checkIns: any[]): MenuAnalytics {
    const totalMeals = menu.meals.length;
    const completedMeals = checkIns.length;
    
    // Popular meals
    const mealCounts = checkIns.reduce((acc, checkIn) => {
      acc[checkIn.meal_name] = (acc[checkIn.meal_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const popularMeals = Object.entries(mealCounts)
      .map(([name, count]) => ({ meal_id: '', name, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Daily completion average
    const dayGroups = checkIns.reduce((acc, checkIn) => {
      const date = checkIn.completed_date.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgDailyCompletion = Object.keys(dayGroups).length > 0
      ? Object.values(dayGroups).reduce((sum, count) => sum + count, 0) / Object.keys(dayGroups).length
      : 0;

    return {
      completion_rate: totalMeals > 0 ? (completedMeals / totalMeals) * 100 : 0,
      popular_meals: popularMeals,
      avg_daily_completion: Math.round(avgDailyCompletion * 10) / 10,
      total_check_ins: completedMeals,
    };
  }

  // Photo verification with OpenAI Vision
  static async verifyMealPhoto(
    photoBase64: string,
    mealDescription: string,
    ingredients: string[]
  ): Promise<{ score: number; confidence: string; match: boolean; notes: string }> {
    try {
      const prompt = `Analyze this food image and determine if it matches the following meal:

Meal: ${mealDescription}
Key ingredients: ${ingredients.join(", ")}

Provide a match confidence score (0-100) and brief notes.
Respond in JSON format:
{
  "score": <0-100>,
  "confidence": "high|medium|low",
  "match": true|false,
  "notes": "brief description of what you see"
}`;

      const response = await OpenAIService.analyzeMealImage(
        photoBase64,
        "english",
        prompt
      );

      // Parse OpenAI response for verification
      const score = response.confidence ? Math.round(response.confidence * 100) : 50;
      
      return {
        score,
        confidence: score >= 70 ? "high" : score >= 40 ? "medium" : "low",
        match: score >= 70,
        notes: response.healthNotes || "Analysis complete",
      };
    } catch (error) {
      console.error("Photo verification error:", error);
      return {
        score: 0,
        confidence: "low",
        match: false,
        notes: "Unable to verify photo",
      };
    }
  }

  // Check in meal with photo
  static async checkInMeal(
    userId: string,
    menuId: string,
    mealId: string,
    mealName: string,
    mealType: string,
    photoBase64: string,
    dayNumber: number,
    notes?: string
  ) {
    // Get meal details
    const meal = await prisma.recommendedMeal.findFirst({
      where: { meal_id: mealId },
      include: { ingredients: true },
    });

    if (!meal) throw new Error("Meal not found");

    // Verify photo
    const verification = await this.verifyMealPhoto(
      photoBase64,
      meal.name,
      meal.ingredients.map(i => i.name)
    );

    // Upload photo to storage (simplified - store base64 for now)
    const photoUrl = `data:image/jpeg;base64,${photoBase64}`;

    // Create meal completion record
    const completion = await prisma.mealCompletion.create({
      data: {
        user_id: userId,
        menu_id: menuId,
        meal_name: mealName,
        meal_type: mealType,
        day_number: dayNumber,
        completed_date: new Date(),
        calories: meal.calories,
        protein_g: meal.protein,
        carbs_g: meal.carbs,
        fats_g: meal.fat,
        rating: verification.match ? 5 : 3,
        notes: notes || verification.notes,
        prep_time_actual: meal.prep_time_minutes,
      },
    });

    // Award XP for meal completion
    const xpGained = verification.score >= 70 ? 15 : 10;
    await prisma.user.update({
      where: { user_id: userId },
      data: {
        current_xp: { increment: xpGained },
        total_points: { increment: xpGained },
      },
    });

    return {
      completion,
      verification,
      xp_gained: xpGained,
      photo_url: photoUrl,
    };
  }

  // Get daily meal timeline
  static async getDailyTimeline(userId: string, menuId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get menu meals for the day
    const menu = await prisma.recommendedMenu.findFirst({
      where: { menu_id: menuId, user_id: userId },
      include: {
        meals: {
          where: { day_number: this.getDayNumberFromDate(date, menuId) },
          include: { ingredients: true },
          orderBy: { meal_type: "asc" },
        },
      },
    });

    if (!menu) return null;

    // Get check-ins for the day
    const checkIns = await prisma.mealCompletion.findMany({
      where: {
        user_id: userId,
        menu_id: menuId,
        completed_date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const timeline = menu.meals.map(meal => {
      const checkIn = checkIns.find(c => c.meal_name === meal.name);
      return {
        meal,
        completed: !!checkIn,
        check_in: checkIn || null,
      };
    });

    const totalMeals = timeline.length;
    const completedMeals = timeline.filter(t => t.completed).length;

    return {
      date,
      menu_name: menu.title,
      timeline,
      completion_percentage: totalMeals > 0 ? Math.round((completedMeals / totalMeals) * 100) : 0,
      total_meals: totalMeals,
      completed_meals: completedMeals,
    };
  }

  private static getDayNumberFromDate(date: Date, menuId: string): number {
    // This would need menu start date from user record
    // For now, return day of week
    return date.getDay() + 1;
  }

  // Get weekly summary
  static async getWeeklySummary(userId: string, menuId: string, startDate: Date) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const checkIns = await prisma.mealCompletion.findMany({
      where: {
        user_id: userId,
        menu_id: menuId,
        completed_date: {
          gte: startDate,
          lt: endDate,
        },
      },
      orderBy: { completed_date: "asc" },
    });

    const totalNutrition = checkIns.reduce(
      (acc, checkIn) => ({
        calories: acc.calories + (checkIn.calories || 0),
        protein: acc.protein + (checkIn.protein_g || 0),
        carbs: acc.carbs + (checkIn.carbs_g || 0),
        fats: acc.fats + (checkIn.fats_g || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    return {
      week_start: startDate,
      week_end: endDate,
      total_check_ins: checkIns.length,
      total_nutrition: totalNutrition,
      avg_daily_calories: Math.round(totalNutrition.calories / 7),
      streak_days: this.calculateStreak(checkIns),
    };
  }

  private static calculateStreak(checkIns: any[]): number {
    if (checkIns.length === 0) return 0;

    const dates = [...new Set(checkIns.map(c => 
      c.completed_date.toISOString().split('T')[0]
    ))].sort();

    let streak = 1;
    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i - 1]);
      const currDate = new Date(dates[i]);
      const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }
}
