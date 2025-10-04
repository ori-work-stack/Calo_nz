import { Router } from "express";
import { SchemaValidator } from "../utils/schemaValidator";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = Router();

// Admin-only endpoint to validate schemas
router.get("/validate", authenticateToken, async (req: AuthRequest, res) => {
  try {
    // Check if user is admin (you may want to add admin check here)
    const results = await SchemaValidator.validateAllSchemas();

    res.json({
      success: true,
      data: results,
      summary: {
        total: results.length,
        fullyImplemented: results.filter((r) => r.issues.length === 0).length,
        partiallyImplemented: results.filter(
          (r) => r.issues.length > 0 && r.issues.length < 3
        ).length,
        notImplemented: results.filter((r) => r.issues.length >= 3).length,
      },
    });
  } catch (error) {
    console.error("Schema validation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to validate schemas",
    });
  }
});

export { router as schemaValidationRoutes };
