/*
  Warnings:

  - You are about to alter the column `total_calories` on the `recommended_menus` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `total_protein` on the `recommended_menus` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `total_carbs` on the `recommended_menus` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `total_fat` on the `recommended_menus` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `total_fiber` on the `recommended_menus` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to drop the `user_meal_preferences` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "SubscriptionType" ADD VALUE 'ADMIN';

-- DropForeignKey
ALTER TABLE "public"."user_meal_preferences" DROP CONSTRAINT "user_meal_preferences_template_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_meal_preferences" DROP CONSTRAINT "user_meal_preferences_user_id_fkey";

-- DropIndex
DROP INDEX "public"."recommended_menus_dietary_category_idx";

-- DropIndex
DROP INDEX "public"."recommended_menus_user_id_idx";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "ai_chat_tokens_reset_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "ai_chat_tokens_used" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_admin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_super_admin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "meal_scans_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "meal_scans_reset_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "recommended_menus" ADD COLUMN     "end_date" TIMESTAMP(3),
ADD COLUMN     "start_date" TIMESTAMP(3),
ALTER COLUMN "total_calories" SET DATA TYPE INTEGER,
ALTER COLUMN "total_protein" DROP NOT NULL,
ALTER COLUMN "total_protein" SET DATA TYPE INTEGER,
ALTER COLUMN "total_carbs" DROP NOT NULL,
ALTER COLUMN "total_carbs" SET DATA TYPE INTEGER,
ALTER COLUMN "total_fat" DROP NOT NULL,
ALTER COLUMN "total_fat" SET DATA TYPE INTEGER,
ALTER COLUMN "days_count" DROP DEFAULT,
ALTER COLUMN "dietary_category" SET DEFAULT 'balanced',
ALTER COLUMN "difficulty_level" DROP NOT NULL,
ALTER COLUMN "difficulty_level" DROP DEFAULT,
ALTER COLUMN "is_active" SET DEFAULT false,
ALTER COLUMN "total_fiber" SET DATA TYPE INTEGER;

-- DropTable
DROP TABLE "public"."user_meal_preferences";

-- CreateTable
CREATE TABLE "UserMealPreference" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "preference_type" TEXT NOT NULL,
    "rating" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "mealTemplateTemplate_id" TEXT,

    CONSTRAINT "UserMealPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuReview" (
    "id" TEXT NOT NULL,
    "menu_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "liked" TEXT,
    "disliked" TEXT,
    "suggestions" TEXT,
    "would_recommend" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenuReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserMealPreference_user_id_idx" ON "UserMealPreference"("user_id");

-- CreateIndex
CREATE INDEX "UserMealPreference_template_id_idx" ON "UserMealPreference"("template_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserMealPreference_user_id_template_id_preference_type_key" ON "UserMealPreference"("user_id", "template_id", "preference_type");

-- CreateIndex
CREATE INDEX "MenuReview_menu_id_idx" ON "MenuReview"("menu_id");

-- CreateIndex
CREATE INDEX "MenuReview_user_id_idx" ON "MenuReview"("user_id");

-- CreateIndex
CREATE INDEX "DailyGoal_date_idx" ON "DailyGoal"("date");

-- CreateIndex
CREATE INDEX "DailyGoal_user_id_idx" ON "DailyGoal"("user_id");

-- AddForeignKey
ALTER TABLE "UserMealPreference" ADD CONSTRAINT "UserMealPreference_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMealPreference" ADD CONSTRAINT "UserMealPreference_mealTemplateTemplate_id_fkey" FOREIGN KEY ("mealTemplateTemplate_id") REFERENCES "meal_templates"("template_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuReview" ADD CONSTRAINT "MenuReview_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
