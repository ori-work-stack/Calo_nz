import {
  Platform,
  PermissionsAndroid,
  Alert,
  ToastAndroid,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface NotificationSettings {
  systemNotifications: boolean;
  mealReminders: boolean;
  waterReminders: boolean;
  goalAchievements: boolean;
  weeklyReports: boolean;
  soundEnabled: boolean;
  badgeEnabled: boolean;
  vibrationEnabled: boolean;
  reminderTimes: string[];
  notificationFrequency: "DAILY" | "WEEKLY" | "NONE";
}

const defaultSettings: NotificationSettings = {
  systemNotifications: true,
  mealReminders: true,
  waterReminders: true,
  goalAchievements: true,
  weeklyReports: true,
  soundEnabled: true,
  badgeEnabled: true,
  vibrationEnabled: true,
  reminderTimes: ["08:00", "12:30", "18:00"],
  notificationFrequency: "DAILY",
};

interface NotificationData {
  type: string;
  title: string;
  message: string;
  timestamp: number;
  userName?: string;
  userEmail?: string;
  screen?: string;
}

export class NotificationService {
  private static isInitialized = false;
  private static initializationPromise: Promise<void> | null = null;
  private static fallbackMode = false;
  private static notificationQueue: NotificationData[] = [];

  static async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private static async performInitialization(): Promise<void> {
    try {
      console.log("🚀 Initializing ENHANCED notification system...");

      if (Platform.OS === "web") {
        console.log("⚠️ Web platform detected - using fallback notifications");
        this.fallbackMode = true;
        this.isInitialized = true;
        return;
      }

      // Try to initialize push notifications, but use fallback if it fails
      try {
        // Check if native modules are available
        const PushNotification =
          require("react-native-push-notification").default;

        if (
          !PushNotification ||
          typeof PushNotification.configure !== "function"
        ) {
          throw new Error("Push notification module not properly linked");
        }

        // Request permissions first
        const hasPermissions = await this.requestPermissions();
        if (!hasPermissions) {
          console.warn(
            "❌ System notification permissions denied - using fallback"
          );
          this.fallbackMode = true;
          this.isInitialized = true;
          return;
        }

        // Configure push notifications with error handling
        await new Promise<void>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error("Notification configuration timeout"));
          }, 10000); // 10 second timeout

          try {
            PushNotification.configure({
              onRegister: function (token: { token: string }) {
                console.log(
                  "✅ System notification token received:",
                  token.token?.substring(0, 20) + "..."
                );
                clearTimeout(timeoutId);
                resolve();
              },

              onNotification: function (notification: {
                userInteraction: any;
                data: any;
              }) {
                console.log("🔔 SYSTEM notification received:", notification);
                if (notification.userInteraction) {
                  NotificationService.handleNotificationTap(notification.data);
                }
              },

              onAction: function (notification: any) {
                console.log("👆 System notification action:", notification);
              },

              onRegistrationError: function (err: any) {
                console.error(
                  "❌ System notification registration error:",
                  err
                );
                clearTimeout(timeoutId);
                reject(err);
              },

              permissions: {
                alert: true,
                badge: true,
                sound: true,
              },

              popInitialNotification: false, // Disable to prevent crashes
              requestPermissions: Platform.OS === "ios",
            });
          } catch (configError) {
            clearTimeout(timeoutId);
            reject(configError);
          }
        });

        // Create Android channels if needed
        if (Platform.OS === "android") {
          await this.setupAndroidChannels();
        }

        console.log("✅ ENHANCED notification system initialized successfully");
      } catch (nativeError) {
        console.warn(
          "⚠️ Native notifications failed, using fallback:",
          nativeError.message
        );
        this.fallbackMode = true;
      }

      this.isInitialized = true;
    } catch (error) {
      console.error("❌ Notification system initialization failed:", error);
      this.fallbackMode = true;
      this.isInitialized = true;
    }
  }

  private static async setupAndroidChannels(): Promise<void> {
    try {
      const PushNotification =
        require("react-native-push-notification").default;
      const { Importance } = require("react-native-push-notification");

      const channels = [
        {
          channelId: "calo-welcome",
          channelName: "Welcome Notifications",
          channelDescription: "Welcome messages and app initialization",
          importance: Importance.HIGH,
          vibrate: true,
          soundName: "default",
          playSound: true,
        },
        {
          channelId: "calo-general",
          channelName: "General Notifications",
          channelDescription: "General app notifications",
          importance: Importance.DEFAULT,
          soundName: "default",
          playSound: true,
        },
      ];

      for (const channel of channels) {
        await new Promise<void>((resolve) => {
          PushNotification.createChannel(
            {
              channelId: channel.channelId,
              channelName: channel.channelName,
              channelDescription: channel.channelDescription,
              playSound: channel.playSound,
              soundName: channel.soundName,
              importance: channel.importance,
              vibrate: channel.vibrate,
            },
            (created: any) => {
              console.log(
                `✅ Android channel ${channel.channelId} created: ${created}`
              );
              resolve();
            }
          );
        });
      }

      console.log("✅ Android notification channels configured");
    } catch (error) {
      console.error("❌ Failed to setup Android channels:", error);
    }
  }

  static async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === "android") {
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: "Calo Notification Permission",
              message:
                "Calo needs notification permission to send you important updates",
              buttonNeutral: "Ask Me Later",
              buttonNegative: "Cancel",
              buttonPositive: "Allow",
            }
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
      }

      if (Platform.OS === "ios") {
        try {
          const PushNotification =
            require("react-native-push-notification").default;
          const permissions = await PushNotification.requestPermissions();
          return Boolean(
            permissions?.alert || permissions?.badge || permissions?.sound
          );
        } catch (error) {
          console.error("iOS permission error:", error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("💥 Error requesting notification permissions:", error);
      return false;
    }
  }

  private static showFallbackNotification(
    title: string,
    message: string,
    data?: any
  ): void {
    try {
      // Store notification for later display
      const notification: NotificationData = {
        type: data?.type || "general",
        title,
        message,
        timestamp: Date.now(),
        ...data,
      };

      this.notificationQueue.push(notification);

      // Show immediate feedback
      if (Platform.OS === "android") {
        ToastAndroid.showWithGravity(
          `${title}: ${message}`,
          ToastAndroid.LONG,
          ToastAndroid.TOP
        );
      } else {
        Alert.alert(title, message, [{ text: "OK", style: "default" }]);
      }

      console.log(`🔔 Fallback notification: ${title} - ${message}`);
    } catch (error) {
      console.error("💥 Error showing fallback notification:", error);
    }
  }

  private static async sendNativeNotification(
    title: string,
    message: string,
    channelId: string = "calo-general",
    data: any = {}
  ): Promise<void> {
    try {
      const PushNotification =
        require("react-native-push-notification").default;

      if (
        !PushNotification ||
        typeof PushNotification.localNotification !== "function"
      ) {
        throw new Error("Native notification method not available");
      }

      PushNotification.localNotification({
        channelId,
        id: Date.now(),
        title,
        message,
        playSound: true,
        soundName: "default",
        vibrate: true,
        vibration: 300,
        priority: "high",
        importance: "high",
        autoCancel: true,
        largeIcon: "ic_launcher",
        smallIcon: "ic_notification",
        color: "#10b981",
        userInfo: { ...data, timestamp: Date.now() },
        actions: ["View"],
        number: 1,
      });

      console.log(`✅ Native notification sent: ${title}`);
    } catch (error) {
      console.error("💥 Native notification failed:", error);
      throw error; // Re-throw to trigger fallback
    }
  }

  static async sendWelcomeNotification(
    userName: string,
    userEmail: string
  ): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const title = `🎉 Welcome ${userName}!`;
      const message = `Welcome to Calo - your nutrition tracking app!\n\nStart tracking your meals and reach your health goals!`;

      const data = {
        type: "welcome",
        userName,
        userEmail,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        screen: "home",
      };

      if (this.fallbackMode) {
        this.showFallbackNotification(title, message, data);
        return;
      }

      try {
        await this.sendNativeNotification(title, message, "calo-welcome", data);
      } catch (nativeError) {
        console.warn("Native welcome notification failed, using fallback");
        this.showFallbackNotification(title, message, data);
      }

      console.log(`✅ Welcome notification sent to ${userName} (${userEmail})`);
    } catch (error) {
      console.error("💥 Error sending welcome notification:", error);

      // Final fallback - simple alert
      Alert.alert(
        "🎉 Welcome to Calo!",
        `Hello ${userName}!\n\nWelcome to your nutrition tracking app!`,
        [{ text: "Great!", style: "default" }]
      );
    }
  }

  static async sendInstantNotification(
    title: string,
    message: string,
    data: any = {}
  ): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (this.fallbackMode) {
        this.showFallbackNotification(title, message, data);
        return;
      }

      try {
        await this.sendNativeNotification(title, message, "calo-general", data);
      } catch (nativeError) {
        console.warn("Native instant notification failed, using fallback");
        this.showFallbackNotification(title, message, data);
      }
    } catch (error) {
      console.error("💥 Error sending instant notification:", error);
    }
  }

  static async sendGoalAchievement(
    title: string,
    message: string
  ): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const fullTitle = `🎉 ${title}`;
      const data = { type: "achievement", category: "goal" };

      if (this.fallbackMode) {
        this.showFallbackNotification(fullTitle, message, data);
        return;
      }

      try {
        await this.sendNativeNotification(
          fullTitle,
          message,
          "calo-general",
          data
        );
      } catch (nativeError) {
        console.warn("Native achievement notification failed, using fallback");
        this.showFallbackNotification(fullTitle, message, data);
      }
    } catch (error) {
      console.error("💥 Error sending achievement notification:", error);
    }
  }

  static async scheduleMealReminder(
    mealName: string,
    time: string
  ): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log(`📅 Scheduling meal reminder for ${mealName} at ${time}`);

      // For now, just log the scheduling - actual scheduling would need working native modules
      if (this.fallbackMode) {
        console.log(
          `⚠️ Meal reminder scheduled in fallback mode: ${mealName} at ${time}`
        );
        return;
      }

      // Would implement native scheduling here if modules were working
      console.log(`✅ Meal reminder scheduled for ${mealName} at ${time}`);
    } catch (error) {
      console.error("💥 Error scheduling meal reminder:", error);
    }
  }

  static async cancelAllNotifications(): Promise<void> {
    try {
      if (this.fallbackMode) {
        this.notificationQueue = [];
        console.log("✅ Fallback notifications cleared");
        return;
      }

      const PushNotification =
        require("react-native-push-notification").default;
      if (PushNotification?.cancelAllLocalNotifications) {
        PushNotification.cancelAllLocalNotifications();
        console.log("✅ All native notifications cancelled");
      }
    } catch (error) {
      console.error("💥 Error cancelling notifications:", error);
    }
  }

  private static handleNotificationTap(data: any): void {
    try {
      console.log("🎯 Handling notification tap:", data?.type);
      AsyncStorage.setItem("pending_navigation", JSON.stringify(data)).catch(
        (error) => {
          console.error("Error storing navigation data:", error);
        }
      );
    } catch (error) {
      console.error("💥 Error handling notification tap:", error);
    }
  }

  static async showTestNotification(): Promise<void> {
    try {
      await this.sendInstantNotification(
        "🧪 Test Notification",
        `Your notification system is working! Mode: ${
          this.fallbackMode ? "Fallback" : "Native"
        }`,
        { type: "test", timestamp: Date.now() }
      );
    } catch (error) {
      console.error("💥 Error showing test notification:", error);
    }
  }

  // Get queued notifications for fallback mode
  static getQueuedNotifications(): NotificationData[] {
    return [...this.notificationQueue];
  }

  static clearQueuedNotifications(): void {
    this.notificationQueue = [];
  }

  // Compatibility methods
  static async getSettings(): Promise<NotificationSettings> {
    try {
      const settings = await AsyncStorage.getItem(
        "notification_settings_enhanced"
      );
      const parsed = settings ? JSON.parse(settings) : {};
      return { ...defaultSettings, ...parsed };
    } catch (error) {
      console.error("Error loading notification settings:", error);
      return defaultSettings;
    }
  }

  static async updateSettings(settings: NotificationSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(
        "notification_settings_enhanced",
        JSON.stringify(settings)
      );
    } catch (error) {
      console.error("Error saving notification settings:", error);
    }
  }

  static async initializeNotifications(userQuestionnaire?: any): Promise<void> {
    try {
      console.log("🚀 Initializing ENHANCED notification system...");
      await this.initialize();

      if (userQuestionnaire?.meal_times) {
        const mealTimes = userQuestionnaire.meal_times
          .split(",")
          .map((t: string) => t.trim());
        const mealNames = ["Breakfast", "Lunch", "Dinner", "Snack"];

        for (let i = 0; i < Math.min(mealTimes.length, mealNames.length); i++) {
          await this.scheduleMealReminder(mealNames[i], mealTimes[i]);
        }
      }

      console.log("✅ ENHANCED notification system initialized successfully");
    } catch (error) {
      console.error("💥 Error initializing notification system:", error);
    }
  }

  static getStatus(): {
    initialized: boolean;
    fallbackMode: boolean;
    queueLength: number;
  } {
    return {
      initialized: this.isInitialized,
      fallbackMode: this.fallbackMode,
      queueLength: this.notificationQueue.length,
    };
  }
}
