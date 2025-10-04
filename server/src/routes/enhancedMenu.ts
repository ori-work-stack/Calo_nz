
import { Router } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { EnhancedMenuService } from "../services/enhancedMenuService";
import { Response } from "express";

const router = Router();

// Get menu with full tracking data
router.get("/:menuId", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.user_id;
    const { menuId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const menuData = await EnhancedMenuService.getMenuWithTracking(userId, menuId);

    if (!menuData) {
      return res.status(404).json({ success: false, error: "Menu not found" });
    }

    res.json({ success: true, data: menuData });
  } catch (error) {
    console.error("Error fetching menu:", error);
    res.status(500).json({ success: false, error: "Failed to fetch menu" });
  }
});

// Get daily timeline
router.get("/:menuId/timeline/:date", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.user_id;
    const { menuId, date } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const timeline = await EnhancedMenuService.getDailyTimeline(
      userId,
      menuId,
      new Date(date)
    );

    res.json({ success: true, data: timeline });
  } catch (error) {
    console.error("Error fetching timeline:", error);
    res.status(500).json({ success: false, error: "Failed to fetch timeline" });
  }
});

// Check in meal with photo
router.post("/:menuId/check-in", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.user_id;
    const { menuId } = req.params;
    const { mealId, mealName, mealType, photoBase64, dayNumber, notes } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    if (!photoBase64) {
      return res.status(400).json({ success: false, error: "Photo required" });
    }

    const result = await EnhancedMenuService.checkInMeal(
      userId,
      menuId,
      mealId,
      mealName,
      mealType,
      photoBase64,
      dayNumber,
      notes
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error checking in meal:", error);
    res.status(500).json({ success: false, error: "Failed to check in meal" });
  }
});

// Get weekly summary
router.get("/:menuId/summary/weekly", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.user_id;
    const { menuId } = req.params;
    const { startDate } = req.query;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const summary = await EnhancedMenuService.getWeeklySummary(
      userId,
      menuId,
      startDate ? new Date(startDate as string) : new Date()
    );

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error("Error fetching summary:", error);
    res.status(500).json({ success: false, error: "Failed to fetch summary" });
  }
});

export default router;
