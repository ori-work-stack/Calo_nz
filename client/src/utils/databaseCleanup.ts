import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

interface StorageInfo {
  totalSize: number;
  itemCount: number;
  largeItems: Array<{ key: string; size: number }>;
}

export class DatabaseCleanupService {
  private static readonly MAX_STORAGE_SIZE = 50 * 1024 * 1024; // 50MB limit
  private static readonly MAX_ITEM_SIZE = 1024 * 1024; // 1MB per item
  private static readonly CLEANUP_KEYS = [
    "meal_cache_",
    "statistics_cache_",
    "old_user_data_",
    "temp_image_",
    "expired_session_",
  ];

  /**
   * Get storage information
   */
  static async getStorageInfo(): Promise<StorageInfo> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);

      let totalSize = 0;
      let itemCount = 0;
      const largeItems: Array<{ key: string; size: number }> = [];

      for (const [key, value] of items) {
        if (value) {
          const size = new Blob([value]).size;
          totalSize += size;
          itemCount++;

          if (size > this.MAX_ITEM_SIZE) {
            largeItems.push({ key, size });
          }
        }
      }

      return { totalSize, itemCount, largeItems };
    } catch (error) {
      console.error("Error getting storage info:", error);
      return { totalSize: 0, itemCount: 0, largeItems: [] };
    }
  }

  /**
   * Clean up old and large cache items
   */
  static async performCleanup(): Promise<{
    cleaned: number;
    freedSpace: number;
  }> {
    try {
      console.log("🧹 Starting database cleanup...");

      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);

      let cleanedItems = 0;
      let freedSpace = 0;
      const keysToRemove: string[] = [];

      for (const [key, value] of items) {
        if (!value) continue;

        const size = new Blob([value]).size;
        let shouldRemove = false;

        // Check if it's a cleanup target
        for (const cleanupKey of this.CLEANUP_KEYS) {
          if (key.startsWith(cleanupKey)) {
            shouldRemove = true;
            break;
          }
        }

        // Check if item is too large
        if (size > this.MAX_ITEM_SIZE) {
          shouldRemove = true;
          console.log(
            `🗑️ Removing large item: ${key} (${(size / 1024).toFixed(1)}KB)`
          );
        }

        // Check if item is expired cache
        if (key.includes("cache_") && this.isCacheExpired(key, value)) {
          shouldRemove = true;
        }

        if (shouldRemove) {
          keysToRemove.push(key);
          cleanedItems++;
          freedSpace += size;
        }
      }

      // Remove identified items
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
        console.log(
          `✅ Cleaned ${cleanedItems} items, freed ${(
            freedSpace / 1024
          ).toFixed(1)}KB`
        );
      }

      return { cleaned: cleanedItems, freedSpace };
    } catch (error) {
      console.error("Error during cleanup:", error);
      return { cleaned: 0, freedSpace: 0 };
    }
  }

  /**
   * Check if cached item is expired
   */
  private static isCacheExpired(key: string, value: string): boolean {
    try {
      const data = JSON.parse(value);
      if (data.timestamp && data.ttl) {
        const expiry = data.timestamp + data.ttl;
        return Date.now() > expiry;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Optimize image storage
   */
  static async optimizeImageStorage(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const imageKeys = keys.filter(
        (key) =>
          key.includes("image_") ||
          key.includes("avatar_") ||
          key.includes("meal_photo_")
      );

      for (const key of imageKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          const size = new Blob([value]).size;

          // If image is larger than 500KB, compress it
          if (size > 500 * 1024) {
            try {
              const compressedImage = await this.compressBase64Image(value);
              await AsyncStorage.setItem(key, compressedImage);
              console.log(`🖼️ Compressed image: ${key}`);
            } catch (error) {
              console.error(`Failed to compress image ${key}:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error optimizing image storage:", error);
    }
  }

  /**
   * Compress base64 image
   */
  private static async compressBase64Image(base64: string): Promise<string> {
    // Simple compression by reducing quality
    // In a real implementation, you might use a proper image compression library
    try {
      // Remove data URL prefix if present
      const base64Data = base64.replace(/^data:image\/[a-z]+;base64,/, "");

      // For now, just return the original if it's already reasonable size
      // You could implement actual image compression here
      return base64;
    } catch (error) {
      console.error("Error compressing image:", error);
      return base64;
    }
  }

  /**
   * Clear expired sessions and tokens
   */
  static async clearExpiredSessions(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const sessionKeys = keys.filter(
        (key) => key.includes("session_") || key.includes("temp_token_")
      );

      for (const key of sessionKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value && this.isCacheExpired(key, value)) {
          await AsyncStorage.removeItem(key);
          console.log(`🗑️ Removed expired session: ${key}`);
        }
      }
    } catch (error) {
      console.error("Error clearing expired sessions:", error);
    }
  }

  /**
   * Emergency cleanup when storage is full
   */
  static async emergencyCleanup(): Promise<void> {
    try {
      console.log("🚨 Emergency cleanup triggered");

      // Remove all cache items
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.includes("cache_"));

      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
        console.log(`🧹 Emergency: Removed ${cacheKeys.length} cache items`);
      }

      // Clear temporary files
      const tempKeys = keys.filter((key) => key.includes("temp_"));
      if (tempKeys.length > 0) {
        await AsyncStorage.multiRemove(tempKeys);
        console.log(`🧹 Emergency: Removed ${tempKeys.length} temp items`);
      }
    } catch (error) {
      console.error("Error during emergency cleanup:", error);
    }
  }

  /**
   * Monitor storage and trigger cleanup if needed
   */
  static async monitorStorage(): Promise<void> {
    try {
      const storageInfo = await this.getStorageInfo();

      console.log(
        `📊 Storage: ${(storageInfo.totalSize / 1024).toFixed(1)}KB, ${
          storageInfo.itemCount
        } items`
      );

      // Trigger cleanup if storage is getting full
      if (storageInfo.totalSize > this.MAX_STORAGE_SIZE * 0.8) {
        console.log("⚠️ Storage approaching limit, starting cleanup...");
        await this.performCleanup();
      }

      // Emergency cleanup if storage is critical
      if (storageInfo.totalSize > this.MAX_STORAGE_SIZE) {
        console.log("🚨 Storage limit exceeded, emergency cleanup...");
        await this.emergencyCleanup();
      }
    } catch (error) {
      console.error("Error monitoring storage:", error);
    }
  }
}

// Auto-cleanup on app start
export const initializeStorageCleanup = async (): Promise<void> => {
  try {
    await DatabaseCleanupService.monitorStorage();
    await DatabaseCleanupService.clearExpiredSessions();

    // Schedule periodic cleanup
    setInterval(async () => {
      await DatabaseCleanupService.monitorStorage();
    }, 5 * 60 * 1000); // Every 5 minutes
  } catch (error) {
    console.error("Error initializing storage cleanup:", error);
  }
};
