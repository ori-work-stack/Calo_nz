import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const MAX_SECURE_STORE_SIZE = 2048; // bytes
const COMPRESSION_THRESHOLD = 1024; // Compress items larger than 1KB

// Simple compression function
const compressString = (str: string): string => {
  try {
    // Remove unnecessary whitespace and format JSON more compactly
    if (str.startsWith("{") || str.startsWith("[")) {
      const parsed = JSON.parse(str);
      return JSON.stringify(parsed); // This removes extra whitespace
    }

    // For non-JSON strings, just trim whitespace
    return str.replace(/\s+/g, " ").trim();
  } catch (error) {
    return str.trim();
  }
};
// Update setSecureItem to handle SecureStore size limits and fallbacks
export const setSecureItem = async (
  key: string,
  value: string
): Promise<void> => {
  let processedValue = value;
  try {
    // Check initial size and compress if needed
    const initialSize = Buffer.byteLength(value, "utf8");
    console.log(`📏 Initial size for ${key}: ${initialSize} bytes`);

    if (value.length > COMPRESSION_THRESHOLD) {
      processedValue = compressString(value);
      console.log(
        `🗜️ Compressed ${key}: ${value.length} -> ${processedValue.length} bytes`
      );
    }

    // Check if value is too large for SecureStore (2048 bytes limit)
    const valueSize = Buffer.byteLength(processedValue, "utf8");

    // Use a more conservative limit (1800 bytes) to account for key size and overhead
    const SAFE_SECURE_STORE_LIMIT = 1800;

    if (valueSize > SAFE_SECURE_STORE_LIMIT) {
      console.warn(
        `📦 Value for key "${key}" is ${valueSize} bytes (>${SAFE_SECURE_STORE_LIMIT}), using AsyncStorage fallback`
      );

      // Clean up any existing SecureStore entry
      try {
        await SecureStore.deleteItemAsync(key);
      } catch (e) {
        // Ignore if key doesn't exist
      }

      // For very large items, split them across multiple AsyncStorage keys
      if (valueSize > 50000) {
        // 50KB
        await splitLargeValue(key, processedValue);
      } else {
        await AsyncStorage.setItem(key, processedValue);
      }
      return;
    }

    await SecureStore.setItemAsync(key, processedValue);
    // Clean up any previous async storage entry if SecureStore is used
    await AsyncStorage.removeItem(key).catch(() => {});

    // Also clean up any split chunks if they exist
    await cleanupSplitChunks(key).catch(() => {});
  } catch (error) {
    console.error(`Failed to set secure item ${key}:`, error);
    // Fallback to AsyncStorage if SecureStore fails
    try {
      console.log(`🔒 Fallback storage for key "${key}" using AsyncStorage`);

      // Check if we need to split the value for AsyncStorage too
      if (processedValue.length > 100000) {
        // 100KB
        await splitLargeValue(key, processedValue);
      } else {
        await AsyncStorage.setItem(key, processedValue);
      }
    } catch (fallbackError) {
      console.error(`Fallback storage also failed for ${key}:`, fallbackError);
      throw fallbackError;
    }
  }
};

// Update getSecureItem to handle AsyncStorage fallback for large values
export const getSecureItem = async (key: string): Promise<string | null> => {
  try {
    const value = await SecureStore.getItemAsync(key);
    if (value !== null) return value;

    // Try AsyncStorage as fallback
    const asyncValue = await AsyncStorage.getItem(key);
    if (asyncValue !== null) return asyncValue;

    // Try to reconstruct from split chunks
    return await reconstructSplitValue(key);
  } catch (error) {
    console.error(`Failed to get secure item ${key}:`, error);
    // Try AsyncStorage as fallback
    try {
      const asyncValue = await AsyncStorage.getItem(key);
      if (asyncValue !== null) return asyncValue;

      // Try to reconstruct from split chunks
      return await reconstructSplitValue(key);
    } catch (fallbackError) {
      console.error(`Fallback storage also failed for ${key}:`, fallbackError);
      return null;
    }
  }
};

// Remove data from both storage types
export const removeSecureItem = async (key: string): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(key).catch(() => {});
    await AsyncStorage.removeItem(key).catch(() => {});
    await cleanupSplitChunks(key).catch(() => {});
  } catch (error) {
    console.error(`Error removing data for key "${key}":`, error);
  }
};

// Helper functions for handling large values
const splitLargeValue = async (key: string, value: string): Promise<void> => {
  const chunkSize = 50000; // 50KB chunks
  const chunks = [];

  for (let i = 0; i < value.length; i += chunkSize) {
    chunks.push(value.substring(i, i + chunkSize));
  }

  // Store chunk count
  await AsyncStorage.setItem(`${key}_chunk_count`, chunks.length.toString());

  // Store each chunk
  for (let i = 0; i < chunks.length; i++) {
    await AsyncStorage.setItem(`${key}_chunk_${i}`, chunks[i]);
  }

  console.log(`📦 Split ${key} into ${chunks.length} chunks`);
};

const reconstructSplitValue = async (key: string): Promise<string | null> => {
  try {
    const chunkCountStr = await AsyncStorage.getItem(`${key}_chunk_count`);
    if (!chunkCountStr) return null;

    const chunkCount = parseInt(chunkCountStr, 10);
    if (isNaN(chunkCount) || chunkCount <= 0) return null;

    const chunks: string[] = [];
    for (let i = 0; i < chunkCount; i++) {
      const chunk = await AsyncStorage.getItem(`${key}_chunk_${i}`);
      if (chunk === null) {
        console.warn(`Missing chunk ${i} for key ${key}`);
        return null;
      }
      chunks.push(chunk);
    }

    return chunks.join("");
  } catch (error) {
    console.error(`Failed to reconstruct split value for ${key}:`, error);
    return null;
  }
};

const cleanupSplitChunks = async (key: string): Promise<void> => {
  try {
    const chunkCountStr = await AsyncStorage.getItem(`${key}_chunk_count`);
    if (!chunkCountStr) return;

    const chunkCount = parseInt(chunkCountStr, 10);
    if (isNaN(chunkCount)) return;

    const keysToRemove = [`${key}_chunk_count`];
    for (let i = 0; i < chunkCount; i++) {
      keysToRemove.push(`${key}_chunk_${i}`);
    }

    await AsyncStorage.multiRemove(keysToRemove);
  } catch (error) {
    console.error(`Failed to cleanup split chunks for ${key}:`, error);
  }
};
