import { Router } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { EnhancedDailyGoalsService } from "../services/database/dailyGoals";
import { prisma } from "../lib/database";

const router = Router();

// GET /api/daily-goals - Get user's daily goals (CREATE IF MISSING)
router.get("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user.user_id;

    console.log("📊 === DAILY GOALS GET REQUEST ===");
    console.log("📊 User ID:", userId);

    // Check user subscription
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { subscription_type: true },
    });

    if (!user || user.subscription_type === "FREE") {
      return res.status(403).json({
        success: false,
        error:
          "Daily goals are not available on the Free plan. Please upgrade to Gold or Platinum.",
        subscriptionRequired: true,
      });
    }

    // Use enhanced service to get goals (creates if missing)
    const goals = await EnhancedDailyGoalsService.getUserDailyGoals(userId);

    console.log("📊 Retrieved/Created goals:", goals);

    res.json({
      success: true,
      data: goals,
      message: "Daily goals retrieved successfully",
    });
  } catch (error) {
    console.error("💥 Error fetching daily goals:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch daily goals",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// PUT /api/daily-goals - Force create daily goals for current user
router.put("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user.user_id;

    console.log("🔄 === FORCE CREATING DAILY GOALS ===");
    console.log("🔄 User ID:", userId);

    // Force create goals for this specific user
    const goals = await EnhancedDailyGoalsService.forceCreateDailyGoalsForUser(
      userId
    );

    console.log("✅ Force created goals:", goals);

    res.json({
      success: true,
      data: goals,
      message: "Daily goals created successfully",
    });
  } catch (error) {
    console.error("💥 Error creating daily goals:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create daily goals",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/daily-goals/create-all - Create goals for ALL users (admin/testing)
router.post("/create-all", authenticateToken, async (req: AuthRequest, res) => {
  try {
    console.log("🚨 === CREATING DAILY GOALS FOR ALL USERS ===");

    // Use force creation to ensure goals are created
    const result =
      await EnhancedDailyGoalsService.forceCreateGoalsForAllUsers();

    console.log("📊 Creation result:", result);

    res.json({
      success: true,
      data: result,
      message: `Goals processed: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped, ${result.errors.length} errors`,
    });
  } catch (error) {
    console.error("💥 Error creating daily goals for all users:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create daily goals for all users",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/daily-goals/verify - Verify daily goals exist in database
router.get("/verify", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user.user_id;

    console.log("🔍 === VERIFYING DAILY GOALS AND DATABASE STATE ===");
    console.log("🔍 User ID:", userId);

    // Use debug method to get complete database state
    const debugInfo = await EnhancedDailyGoalsService.debugDatabaseState();

    // Get user-specific goals
    const userGoals = await EnhancedDailyGoalsService.getUserDailyGoals(userId);

    res.json({
      success: true,
      data: {
        userGoals,
        debugInfo,
        userId,
      },
      message: "Daily goals verification and debug completed",
    });
  } catch (error) {
    console.error("💥 Error verifying daily goals:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify daily goals",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/daily-goals/force-single - Force create goal for single user (testing)
router.post(
  "/force-single",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user.user_id;

      console.log("🔄 === FORCE CREATING SINGLE USER GOAL ===");
      console.log("🔄 User ID:", userId);

      // Use simple creation method
      const success = await EnhancedDailyGoalsService.createDailyGoalForUser(
        userId
      );

      if (success) {
        // Get the created goal
        const goals = await EnhancedDailyGoalsService.getUserDailyGoals(userId);

        res.json({
          success: true,
          data: goals,
          message: "Daily goal created successfully for single user",
        });
      } else {
        res.status(500).json({
          success: false,
          error: "Failed to create daily goal for user",
        });
      }
    } catch (error) {
      console.error("💥 Error creating single user goal:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create daily goal",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// GET /api/daily-goals/history - Get user's historical daily goals by date range
router.get("/history", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user.user_id;
    const { startDate, endDate } = req.query;

    console.log("📊 === GETTING HISTORICAL DAILY GOALS ===");
    console.log("📊 User ID:", userId);
    console.log("📅 Date range:", startDate, "to", endDate);

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: "Both startDate and endDate are required",
      });
    }

    // Parse dates
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Fetch historical goals
    const historicalGoals = await prisma.dailyGoal.findMany({
      where: {
        user_id: userId,
        date: {
          gte: start,
          lte: end,
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    console.log(`📊 Found ${historicalGoals.length} historical goals`);

    const formattedGoals = historicalGoals.map((goal) => ({
      date: goal.date.toISOString().split("T")[0],
      calories: Number(goal.calories),
      protein_g: Number(goal.protein_g),
      carbs_g: Number(goal.carbs_g),
      fats_g: Number(goal.fats_g),
      fiber_g: Number(goal.fiber_g),
      sodium_mg: Number(goal.sodium_mg),
      sugar_g: Number(goal.sugar_g),
      water_ml: Number(goal.water_ml),
      created_at: goal.created_at,
      updated_at: goal.updated_at,
    }));

    res.json({
      success: true,
      data: formattedGoals,
      message: `Retrieved ${historicalGoals.length} historical goals`,
    });
  } catch (error) {
    console.error("💥 Error fetching historical daily goals:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch historical daily goals",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/daily-goals/by-date/:date - Get user's daily goal for a specific date
router.get(
  "/by-date/:date",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user.user_id;
      const { date } = req.params;

      console.log("📊 === GETTING DAILY GOAL FOR SPECIFIC DATE ===");
      console.log("📊 User ID:", userId);
      console.log("📅 Date:", date);

      const targetDate = new Date(date);

      const dailyGoal = await prisma.dailyGoal.findFirst({
        where: {
          user_id: userId,
          date: targetDate,
        },
      });

      if (!dailyGoal) {
        return res.status(404).json({
          success: false,
          error: "No daily goal found for this date",
        });
      }

      res.json({
        success: true,
        data: {
          date: dailyGoal.date.toISOString().split("T")[0],
          calories: Number(dailyGoal.calories),
          protein_g: Number(dailyGoal.protein_g),
          carbs_g: Number(dailyGoal.carbs_g),
          fats_g: Number(dailyGoal.fats_g),
          fiber_g: Number(dailyGoal.fiber_g),
          sodium_mg: Number(dailyGoal.sodium_mg),
          sugar_g: Number(dailyGoal.sugar_g),
          water_ml: Number(dailyGoal.water_ml),
          created_at: dailyGoal.created_at,
          updated_at: dailyGoal.updated_at,
        },
        message: "Daily goal retrieved successfully",
      });
    } catch (error) {
      console.error("💥 Error fetching daily goal by date:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch daily goal",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export { router as dailyGoalsRoutes };
