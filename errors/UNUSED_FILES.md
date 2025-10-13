Unused Files and Schemas Analysis
UNUSED/DEPRECATED FILES
Server Files
server/src/services/aiRecommendations.ts - DUPLICATE

This is duplicated by server/src/services/database/aiRecommendations.ts
The enhanced version in database/ folder should be used
server/src/services/cron.ts - POTENTIALLY UNUSED

Replaced by server/src/services/cron/enhanced.ts
Check if still referenced anywhere
server/src/services/cronJobs.ts - POTENTIALLY UNUSED

Replaced by enhanced cron jobs
Check if still referenced
server/src/services/userCleanup.ts - UNCLEAR USAGE

Not imported in any route files
May be used in cron jobs
Client Files
client/components/statistics/GamificationDashboard.tsx - DUPLICATE

Replaced by EnhancedGamificationDashboard.tsx
client/components/statistics/MetricCard.tsx - DUPLICATE

Replaced by EnhancedMetricCard.tsx
client/components/statistics/TimePeriodFilter.tsx - DUPLICATE

Replaced by EnhancedTimePeriodFilter.tsx
client/components/menu/MenuCreator.tsx - DUPLICATE

Replaced by EnhancedMenuCreator.tsx
client/src/utils/useOptimizedSelector.ts - DUPLICATE

Already exists in client/hooks/useOptimizedSelector.ts
client/components/DynamicListInputs.tsx - POTENTIALLY UNUSED

Similar to DynamicListInput.tsx in questionnaire folder
client/components/NoteficationSettings.tsx - TYPO/DUPLICATE

Typo version of NotificationSettings.tsx
UNUSED DATABASE SCHEMAS
Models Not Referenced in Code
AdminDashboard - REMOVED IN COMMENTS

Already marked as unused in schema
GamificationBadge - UNCLEAR USAGE

Referenced in schema but may not be used in services
Check if Badge and UserBadge models replace this
MenuReview - LIMITED USAGE

Schema exists but routes may not be fully implemented
Check server/src/routes/enhancedMenu.ts for usage
Potentially Redundant Fields
User model:

ai_requests_count - May be tracked elsewhere
ai_requests_reset_at - May be tracked elsewhere
active_meal_plan_id - String field but not used as foreign key
active_menu_id - String field but not used as foreign key
UserQuestionnaire model:

Multiple legacy fields marked as "keeping for compatibility"
program_duration, meal_timing_restrictions, etc.
Meal model:

Many optional nutritional fields that may not be populated
additives_json defaulting to empty object
ROUTES NOT FULLY IMPLEMENTED
server/src/routes/schema-validation.ts - UNCLEAR PURPOSE

May be a test/debug route
server/src/routes/health.ts - LIMITED USAGE

Basic health check, may not be actively used
SERVICES WITH UNCLEAR USAGE
server/src/services/usageTracking.ts

Not imported in route files
May be used in middleware
server/src/utils/nutrition.ts

Utility functions that may not be used
server/src/utils/openai.ts

May be replaced by server/src/services/openai.ts
RECOMMENDATIONS
Immediate Deletions (High Confidence)
Delete duplicate "Enhanced" originals after confirming enhanced versions work
Delete typo file: NoteficationSettings.tsx
Delete duplicate in utils folder
Needs Investigation
Check cron job files for active usage
Verify userCleanup service usage
Confirm schema-validation route purpose
Review legacy questionnaire fields
Database Cleanup
Consider removing GamificationBadge if Badge/UserBadge models are sufficient
Clean up unused User fields after verification
Remove legacy questionnaire fields if not needed for migration
VERIFICATION COMMANDS
Run these to verify usage:

# Search for imports of potentially unused files

grep -r "aiRecommendations" server/src --include="_.ts"
grep -r "cron.ts" server/src --include="_.ts"
grep -r "GamificationDashboard" client --include="_.tsx"
grep -r "MenuCreator" client --include="_.tsx"
