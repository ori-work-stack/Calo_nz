
import { Router, Response } from "express";
import { authenticateToken, requireAdmin, requireSuperAdmin, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/database";

const router = Router();

// Apply admin authentication to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Get dashboard statistics (Admin access)
router.get("/stats", async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      todaySignups,
      todayLogins,
      totalMeals,
      totalMenus,
      activeSubscriptions,
      revenueData,
      weeklySignups,
      monthlySignups,
      weeklyMeals,
      monthlyMeals,
      avgMealsPerUser,
      topUsers,
      completionStats
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { created_at: { gte: today } } }),
      prisma.session.count({ where: { created_at: { gte: today } } }),
      prisma.meal.count(),
      prisma.recommendedMenu.count(),
      prisma.user.groupBy({
        by: ['subscription_type'],
        _count: true,
      }),
      prisma.subscriptionPayment.aggregate({
        _sum: { amount: true },
        _count: true,
      }),
      prisma.user.count({ where: { created_at: { gte: last7Days } } }),
      prisma.user.count({ where: { created_at: { gte: last30Days } } }),
      prisma.meal.count({ where: { created_at: { gte: last7Days } } }),
      prisma.meal.count({ where: { created_at: { gte: last30Days } } }),
      prisma.meal.groupBy({
        by: ['user_id'],
        _count: true,
      }).then(results => results.reduce((sum, r) => sum + r._count, 0) / Math.max(results.length, 1)),
      prisma.user.findMany({
        take: 10,
        orderBy: { total_points: 'desc' },
        select: {
          user_id: true,
          name: true,
          email: true,
          level: true,
          total_points: true,
          current_streak: true,
          subscription_type: true,
        }
      }),
      prisma.user.aggregate({
        _avg: {
          current_streak: true,
          total_complete_days: true,
        },
        _max: {
          current_streak: true,
          best_streak: true,
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          todaySignups,
          todayLogins,
          totalMeals,
          totalMenus,
          weeklySignups,
          monthlySignups,
          weeklyMeals,
          monthlyMeals,
          avgMealsPerUser: Math.round(avgMealsPerUser),
        },
        subscriptions: activeSubscriptions.reduce((acc, sub) => {
          acc[sub.subscription_type] = sub._count;
          return acc;
        }, {} as Record<string, number>),
        revenue: {
          total: revenueData._sum.amount || 0,
          transactions: revenueData._count,
        },
        engagement: {
          avgStreak: Math.round(completionStats._avg.current_streak || 0),
          avgCompleteDays: Math.round(completionStats._avg.total_complete_days || 0),
          maxStreak: completionStats._max.current_streak || 0,
          bestStreak: completionStats._max.best_streak || 0,
        },
        topUsers,
      }
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch statistics" });
  }
});

// Get all users with pagination (Admin access)
router.get("/users", async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;

    const where = search ? {
      OR: [
        { email: { contains: search, mode: 'insensitive' as const } },
        { name: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          user_id: true,
          email: true,
          name: true,
          subscription_type: true,
          created_at: true,
          email_verified: true,
          is_questionnaire_completed: true,
          level: true,
          total_points: true,
          current_streak: true,
          _count: {
            select: {
              meals: true,
              recommendedMenus: true,
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error("Admin users error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch users" });
  }
});

// Get user details (Admin access)
router.get("/users/:userId", async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      include: {
        questionnaires: { take: 1, orderBy: { date_completed: 'desc' } },
        meals: { take: 10, orderBy: { created_at: 'desc' } },
        recommendedMenus: { take: 5, orderBy: { created_at: 'desc' } },
        payments: { orderBy: { payment_date: 'desc' } },
        achievements: { include: { achievement: true } },
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error("Admin user details error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch user details" });
  }
});

// Delete user (Super Admin only - most sensitive operation)
router.delete("/users/:userId", requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Prevent self-deletion
    if (userId === req.user?.user_id) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete your own account"
      });
    }

    const { UserCleanupService } = await import("../services/userCleanup");
    await UserCleanupService.deleteUserCompletely(userId);
    
    console.log(`🗑️ User ${userId} deleted by admin ${req.user?.email}`);
    
    res.json({ 
      success: true, 
      message: "User deleted successfully" 
    });
  } catch (error) {
    console.error("Admin delete user error:", error);
    res.status(500).json({ success: false, error: "Failed to delete user" });
  }
});

// Update user subscription (Super Admin only)
router.patch("/users/:userId/subscription", requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { subscription_type } = req.body;

    const validTypes = ["FREE", "GOLD", "PREMIUM", "ADMIN"];
    if (!validTypes.includes(subscription_type)) {
      return res.status(400).json({
        success: false,
        error: "Invalid subscription type"
      });
    }

    const updatedUser = await prisma.user.update({
      where: { user_id: userId },
      data: { subscription_type },
      select: {
        user_id: true,
        email: true,
        subscription_type: true,
      }
    });

    console.log(`✅ User ${userId} subscription updated to ${subscription_type} by ${req.user?.email}`);

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error("Update subscription error:", error);
    res.status(500).json({ success: false, error: "Failed to update subscription" });
  }
});

// Get recent activity (Admin access)
router.get("/activity", async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    const [recentMeals, recentSignups, recentPayments] = await Promise.all([
      prisma.meal.findMany({
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          meal_id: true,
          meal_name: true,
          calories: true,
          created_at: true,
          user: { select: { name: true, email: true } }
        }
      }),
      prisma.user.findMany({
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          user_id: true,
          name: true,
          email: true,
          subscription_type: true,
          created_at: true,
        }
      }),
      prisma.subscriptionPayment.findMany({
        take: limit,
        orderBy: { payment_date: 'desc' },
        select: {
          payment_id: true,
          plan_type: true,
          amount: true,
          payment_date: true,
          user: { select: { name: true, email: true } }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        recentMeals,
        recentSignups,
        recentPayments
      }
    });
  } catch (error) {
    console.error("Admin activity error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch activity" });
  }
});

// Get system health (Admin access)
router.get("/system/health", async (req: AuthRequest, res: Response) => {
  try {
    const dbHealth = await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      success: true,
      data: {
        status: "healthy",
        database: dbHealth ? "connected" : "disconnected",
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("System health check error:", error);
    res.status(500).json({ 
      success: false, 
      error: "System health check failed",
      data: { status: "unhealthy" }
    });
  }
});

// Promote user to admin (Super Admin only)
router.patch("/users/:userId/promote-admin", requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { is_admin, is_super_admin } = req.body;

    // Build update data object conditionally
    const updateData: any = {};
    if (is_admin !== undefined) updateData.is_admin = is_admin;
    if (is_super_admin !== undefined) updateData.is_super_admin = is_super_admin;

    const updatedUser = await prisma.user.update({
      where: { user_id: userId },
      data: updateData,
      select: {
        user_id: true,
        email: true,
        is_admin: true,
        is_super_admin: true,
      }
    });

    console.log(`✅ User ${userId} admin status updated by ${req.user?.email}`);

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error("Promote admin error:", error);
    res.status(500).json({ success: false, error: "Failed to update admin status" });
  }
});

export default router;
