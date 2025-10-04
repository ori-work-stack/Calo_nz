import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export interface StorageInfo {
  totalSize: number;
  usedSize: number;
  availableSize: number;
  largeItems: Array<{
    key: string;
    size: number;
  }>;
}

export class StorageCleanupService {
  private static readonly STORAGE_WARNING_THRESHOLD = 0.5; // 50% - more aggressive
  private static readonly STORAGE_CRITICAL_THRESHOLD = 0.7; // 70% - earlier intervention
  private static readonly LARGE_ITEM_THRESHOLD = 512; // 512 bytes
  private static readonly MAX_STORAGE_SIZE = 50 * 1024 * 1024; // 50MB - increased from 10MB
  private static readonly SECURE_STORE_SIZE_LIMIT = 2048; // SecureStore limit
  private static readonly CLEANUP_AGE_DAYS = 3; // Keep only 3 days of data instead of 7

  static async checkAndCleanupIfNeeded(): Promise<boolean> {
    try {
      // Immediate check for SQLITE_FULL error
      if (await this.isDatabaseFull()) {
        console.log("🚨 SQLITE_FULL detected - running emergency cleanup");
        return await this.emergencyCleanup();
      }

      // Check available storage first
      const hasSpace = await this.checkAvailableStorage();
      if (!hasSpace) {
        console.log("🚨 No available storage, running emergency cleanup");
        return await this.emergencyCleanup();
      }

      const storageInfo = await this.getStorageInfo();
      const usageRatio = storageInfo.usedSize / storageInfo.totalSize;

      console.log(
        `📊 Storage usage: ${Math.round(usageRatio * 100)}% (${
          storageInfo.usedSize
        }/${storageInfo.totalSize} bytes)`
      );

      if (usageRatio > this.STORAGE_CRITICAL_THRESHOLD) {
        console.log(
          "🚨 Critical storage usage detected, running emergency cleanup"
        );
        return await this.emergencyCleanup();
      } else if (usageRatio > this.STORAGE_WARNING_THRESHOLD) {
        console.log("⚠️ High storage usage detected, running routine cleanup");
        return await this.routineCleanup();
      }

      return true;
    } catch (error) {
      console.error("❌ Storage check failed:", error);
      return await this.emergencyCleanup();
    }
  }

  static async checkAvailableStorage(): Promise<boolean> {
    try {
      const testKey = `storage_test_${Date.now()}`;
      const testData = "test_data_for_storage_check";

      await AsyncStorage.setItem(testKey, testData);
      await AsyncStorage.removeItem(testKey);

      return true;
    } catch (error: any) {
      console.error("🚨 Storage availability check failed:", error);

      const isStorageFull =
        error?.message?.includes("database or disk is full") ||
        error?.message?.includes("SQLITE_FULL") ||
        error?.code === 13 ||
        error?.message?.includes("No space left") ||
        error?.message?.includes("disk full");

      return !isStorageFull;
    }
  }

  static async isDatabaseFull(): Promise<boolean> {
    try {
      const testKey = "storage_test_" + Date.now();
      await AsyncStorage.setItem(testKey, "test");
      await AsyncStorage.removeItem(testKey);
      return false;
    } catch (error: any) {
      console.error("🚨 Database storage test failed:", error);
      return (
        error?.message?.includes("database or disk is full") ||
        error?.code === 13 ||
        error?.message?.includes("SQLITE_FULL") ||
        error?.message?.includes("disk full") ||
        error?.message?.includes("No space left")
      );
    }
  }

  static async emergencyCleanup(): Promise<boolean> {
    try {
      console.log("🆘 Starting emergency storage cleanup for SQLITE_FULL...");

      // Step 1: Selective cleanup - DON'T clear everything, preserve auth
      const keysToPreserve = [
        "persist:auth", // Keep auth state
        "userToken",
        "userId",
        "@user_id",
        "@auth_token",
      ];

      try {
        console.log("🗑️ Clearing non-essential AsyncStorage items...");
        const allKeys = await AsyncStorage.getAllKeys();
        const keysToRemove = allKeys.filter(
          (key) => !keysToPreserve.some((preserve) => key.includes(preserve))
        );

        console.log(
          `📊 Removing ${keysToRemove.length} of ${allKeys.length} keys`
        );

        // Remove in batches to avoid overwhelming the system
        const batchSize = 10;
        for (let i = 0; i < keysToRemove.length; i += batchSize) {
          const batch = keysToRemove.slice(i, i + batchSize);
          await AsyncStorage.multiRemove(batch);
        }

        console.log("✅ Selective AsyncStorage cleanup completed");
      } catch (error) {
        console.error("❌ AsyncStorage selective cleanup failed:", error);
        // Try removing individual keys one by one as fallback
        try {
          const allKeys = await AsyncStorage.getAllKeys();
          for (const key of allKeys) {
            if (!keysToPreserve.some((preserve) => key.includes(preserve))) {
              try {
                await AsyncStorage.removeItem(key);
              } catch (e) {
                // Continue with next key
              }
            }
          }
        } catch (e) {
          console.error("Failed to remove individual keys:", e);
        }
      }

      // Step 2: Selective SecureStore cleanup - PRESERVE AUTH
      if (Platform.OS !== "web") {
        try {
          // Keys to PRESERVE (don't delete these)
          const authKeysToPreserve = [
            "persist:auth",
            "userToken",
            "userId",
            "auth_token",
          ];

          // Keys to remove (non-auth cache and data)
          const keysToRemove = [
            "meal_data",
            "pendingMeal",
            "cachedUserData",
            "largeImageData",
            "meal_cache",
            "user_profile_cache",
            "persist:meal",
            "persist:calendar",
            "persist:questionnaire",
            "persist:statistics",
            "image_cache_",
            "query_cache_",
            "user_questionnaire",
            "meal_analysis_",
            "notification_settings",
            "notification_settings_v3",
            "global_notifications_enabled_v3",
          ];

          for (const key of keysToRemove) {
            try {
              await SecureStore.deleteItemAsync(key);
            } catch (e) {
              // Key might not exist
            }
          }
          console.log("✅ SecureStore selectively cleared (auth preserved)");
        } catch (error) {
          console.error("❌ SecureStore cleanup failed:", error);
        }
      }

      // Step 3: Clear TanStack Query cache
      try {
        const { queryClient } = await import("../services/queryClient");
        queryClient.clear();
        queryClient.removeQueries();
        console.log("✅ Cleared TanStack Query cache");
      } catch (error) {
        console.warn("⚠️ Failed to clear query cache:", error);
      }

      // Step 4: Force garbage collection
      if (global.gc) {
        global.gc();
        console.log("✅ Forced garbage collection");
      }

      console.log("✅ Emergency cleanup completed");
      return true;
    } catch (error) {
      console.error("❌ Emergency cleanup failed:", error);
      return false;
    }
  }

  static async routineCleanup(): Promise<boolean> {
    try {
      console.log("🧹 Starting routine storage cleanup...");

      await this.clearOldMealData(this.CLEANUP_AGE_DAYS); // Use configurable cleanup age
      await this.clearTemporaryData();
      await this.clearAnalyticsData();
      await this.compressLargeItems();
      await this.clearOldCacheData(this.CLEANUP_AGE_DAYS); // Clear old cached data

      console.log("✅ Routine cleanup completed");
      return true;
    } catch (error) {
      console.error("❌ Routine cleanup failed:", error);
      return false;
    }
  }

  // New method to clear old cached data
  private static async clearOldCacheData(daysToKeep: number): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      const cutoffTimestamp = cutoffDate.getTime();

      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(
        (key) =>
          key.includes("cache_") ||
          key.includes("_cache") ||
          key.includes("query-cache") ||
          key.includes("image_cache")
      );

      let removed = 0;
      for (const key of cacheKeys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            const data = JSON.parse(value);
            if (data.timestamp && data.timestamp < cutoffTimestamp) {
              await AsyncStorage.removeItem(key);
              removed++;
            }
          }
        } catch (e) {
          // If we can't parse it, it's probably corrupted, remove it
          await AsyncStorage.removeItem(key);
          removed++;
        }
      }

      console.log(`🗑️ Removed ${removed} old cache items`);
    } catch (error) {
      console.error("Failed to clear old cache data:", error);
    }
  }

  private static async getStorageInfo(): Promise<StorageInfo> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalUsedSize = 0;
      const largeItems: Array<{ key: string; size: number }> = [];

      for (const key of keys) {
        try {
          const value = await AsyncStorage.getItem(key);
          const itemSize = value ? new Blob([value]).size : 0;
          totalUsedSize += itemSize;

          if (itemSize > this.LARGE_ITEM_THRESHOLD) {
            largeItems.push({ key, size: itemSize });
          }
        } catch (error) {
          console.warn(`Failed to get size for key ${key}:`, error);
          try {
            await AsyncStorage.removeItem(key);
          } catch (e) {
            // Ignore removal errors
          }
        }
      }

      return {
        totalSize: this.MAX_STORAGE_SIZE,
        usedSize: totalUsedSize,
        availableSize: this.MAX_STORAGE_SIZE - totalUsedSize,
        largeItems: largeItems.sort((a, b) => b.size - a.size),
      };
    } catch (error) {
      console.error("Failed to get storage info:", error);
      return {
        totalSize: this.MAX_STORAGE_SIZE,
        usedSize: 0,
        availableSize: this.MAX_STORAGE_SIZE,
        largeItems: [],
      };
    }
  }

  private static async clearOldMealData(daysToKeep: number = 7): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const keys = await AsyncStorage.getAllKeys();
      const keysToRemove = [];

      for (const key of keys) {
        if (
          key.includes("meal_") ||
          key.includes("pendingMeal") ||
          key.includes("persist:meal")
        ) {
          try {
            const value = await AsyncStorage.getItem(key);
            if (value) {
              const data = JSON.parse(value);
              const timestamp =
                data.timestamp || data.created_at || data.upload_time;

              if (timestamp && new Date(timestamp) < cutoffDate) {
                keysToRemove.push(key);
              } else if (!timestamp) {
                keysToRemove.push(key);
              }
            }
          } catch (error) {
            keysToRemove.push(key);
          }
        }
      }

      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
        console.log(`🗑️ Cleared ${keysToRemove.length} old meal data items`);
      }
    } catch (error) {
      console.error("Failed to clear old meal data:", error);
    }
  }

  private static async clearTemporaryData(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const tempKeys = keys.filter(
        (key) =>
          key.includes("temp_") ||
          key.includes("tmp_") ||
          key.includes("cache_") ||
          key.startsWith("__") ||
          key.includes("query_cache") ||
          key.includes("image_") ||
          key.includes("photo_") ||
          key.includes("base64_")
      );

      if (tempKeys.length > 0) {
        await AsyncStorage.multiRemove(tempKeys);
        console.log(`🧹 Cleared ${tempKeys.length} temporary items`);
      }
    } catch (error) {
      console.error("Failed to clear temporary data:", error);
    }
  }

  private static async clearAnalyticsData(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const analyticsKeys = keys.filter(
        (key) =>
          key.includes("analytics_") ||
          key.includes("debug_") ||
          key.includes("log_") ||
          key.includes("crash_") ||
          key.includes("performance_")
      );

      if (analyticsKeys.length > 0) {
        await AsyncStorage.multiRemove(analyticsKeys);
        console.log(`📊 Cleared ${analyticsKeys.length} analytics items`);
      }
    } catch (error) {
      console.error("Failed to clear analytics data:", error);
    }
  }

  private static async compressLargeItems(): Promise<void> {
    try {
      const storageInfo = await this.getStorageInfo();

      for (const item of storageInfo.largeItems.slice(0, 3)) {
        try {
          const value = await AsyncStorage.getItem(item.key);
          if (value && item.size > 1024) {
            const compressed = this.compressString(value);
            if (compressed.length < value.length * 0.9) {
              await AsyncStorage.setItem(item.key, compressed);
              console.log(
                `🗜️ Compressed ${item.key}: ${item.size} -> ${compressed.length} bytes`
              );
            }
          }
        } catch (error) {
          console.warn(`Failed to compress ${item.key}:`, error);
        }
      }
    } catch (error) {
      console.error("Failed to compress large items:", error);
    }
  }

  private static compressString(str: string): string {
    try {
      return str
        .replace(/\s+/g, " ")
        .replace(/\n\s*/g, "\n")
        .replace(/\r/g, "")
        .trim();
    } catch (error) {
      return str;
    }
  }

  static async checkStorageBeforeOperation(): Promise<boolean> {
    try {
      const testResult = await this.performMinimalStorageTest();
      if (!testResult) {
        console.log("🚨 Storage test failed - running emergency cleanup");
        await this.emergencyCleanup();
        return await this.performMinimalStorageTest();
      }
      return true;
    } catch (error) {
      console.error("❌ Storage check failed:", error);
      await this.emergencyCleanup();
      return false;
    }
  }

  static async performMinimalStorageTest(): Promise<boolean> {
    try {
      const testKey = `test_${Date.now()}`;
      const testValue = "test";

      await AsyncStorage.setItem(testKey, testValue);
      const retrieved = await AsyncStorage.getItem(testKey);
      await AsyncStorage.removeItem(testKey);

      return retrieved === testValue;
    } catch (error: any) {
      console.error("🚨 Minimal storage test failed:", error);

      const isSQLiteError =
        error?.message?.includes("database or disk is full") ||
        error?.message?.includes("SQLITE_FULL") ||
        error?.code === 13 ||
        error?.message?.includes("No space left") ||
        error?.message?.includes("disk full");

      return !isSQLiteError;
    }
  }

  static async monitorStorageUsage(): Promise<void> {
    try {
      const storageInfo = await this.getStorageInfo();
      const usageRatio = storageInfo.usedSize / storageInfo.totalSize;

      console.log(`📊 Storage Monitor: ${Math.round(usageRatio * 100)}% used`);

      if (usageRatio > 0.8) {
        console.warn("⚠️ Storage usage is high, consider cleanup");
        await this.routineCleanup();
      }
    } catch (error) {
      console.error("Failed to monitor storage:", error);
    }
  }
}
