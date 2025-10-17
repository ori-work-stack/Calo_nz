import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";

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

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  private static isInitialized = false;
  private static expoPushToken: string | null = null;

  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log("🚀 Initializing push notification system...");

      // Request permissions
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        console.warn("❌ Notification permissions denied");
        this.isInitialized = true;
        return;
      }

      // Register for push notifications
      const token = await this.registerForPushNotifications();
      if (token) {
        this.expoPushToken = token;
        console.log("✅ Push token obtained:", token.substring(0, 20) + "...");

        // Store token for backend
        await AsyncStorage.setItem("expo_push_token", token);
      }

      // Set up notification handlers
      this.setupNotificationHandlers();

      this.isInitialized = true;
      console.log("✅ Push notification system initialized successfully");
    } catch (error) {
      console.error("❌ Notification initialization failed:", error);
      this.isInitialized = true;
    }
  }

  static async requestPermissions(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        console.warn("Push notifications only work on physical devices");
        return false;
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.warn("Failed to get push notification permissions");
        return false;
      }

      return true;
    } catch (error) {
      console.error("💥 Error requesting permissions:", error);
      return false;
    }
  }

  private static async registerForPushNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.log("⚠️ Skipping push notifications - not on physical device");
        return null;
      }

      // Skip in Expo Go - push notifications require a development build
      if (__DEV__ && Constants.appOwnership === 'expo') {
        console.log("⚠️ Skipping push notifications in Expo Go");
        return null;
      }

      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId;

      if (!projectId) {
        console.warn("⚠️ No projectId found, skipping push notification registration");
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({ projectId });

      // Configure channels for Android
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#10b981",
        });

        await Notifications.setNotificationChannelAsync("meal-reminders", {
          name: "Meal Reminders",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#10b981",
          sound: "default",
        });
      }

      return token.data;
    } catch (error) {
      console.error("Error getting push token:", error);
      return null;
    }
  }

  private static setupNotificationHandlers(): void {
    // Handle notification received while app is in foreground
    Notifications.addNotificationReceivedListener((notification) => {
      console.log("🔔 Notification received");
      // Don't log full notification object to avoid dataString deprecation warning
    });

    // Handle notification tapped
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("👆 Notification tapped");
      const data = response.notification.request.content.data;

      // Store navigation data
      if (data && typeof data === 'object') {
        AsyncStorage.setItem("pending_navigation", JSON.stringify(data)).catch(
          console.error,
        );
      }
    });
  }

  static async sendLocalNotification(
    title: string,
    body: string,
    data?: any,
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error("Error sending local notification:", error);
    }
  }

  static async sendWelcomeNotification(
    userName: string,
    userEmail: string,
  ): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const title = `🎉 Welcome ${userName}!`;
      const body = `Welcome to Calo - your nutrition tracking app!\n\nStart tracking your meals and reach your health goals!`;

      await this.sendLocalNotification(title, body, {
        type: "welcome",
        userName,
        userEmail,
        screen: "home",
      });

      console.log(`✅ Welcome notification sent to ${userName}`);
    } catch (error) {
      console.error("💥 Error sending welcome notification:", error);
    }
  }

  static async sendInstantNotification(
    title: string,
    message: string,
    data: any = {},
  ): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      await this.sendLocalNotification(title, message, data);
    } catch (error) {
      console.error("💥 Error sending instant notification:", error);
    }
  }

  static async sendGoalAchievement(
    title: string,
    message: string,
  ): Promise<void> {
    try {
      await this.sendLocalNotification(`🎉 ${title}`, message, {
        type: "achievement",
        category: "goal",
      });
    } catch (error) {
      console.error("💥 Error sending achievement notification:", error);
    }
  }

  static async scheduleMealReminder(
    mealName: string,
    time: string,
  ): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const [hours, minutes] = time.split(":").map(Number);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🍽️ ${mealName} Time!`,
          body: `Don't forget to log your ${mealName.toLowerCase()} and track your nutrition!`,
          data: {
            type: "meal_reminder",
            mealName,
            time,
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          repeats: true,
          hour: hours,
          minute: minutes,
        },
      });

      console.log(`✅ Meal reminder scheduled for ${mealName} at ${time}`);
    } catch (error) {
      console.error("💥 Error scheduling meal reminder:", error);
    }
  }

  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log("✅ All notifications cancelled");
    } catch (error) {
      console.error("💥 Error cancelling notifications:", error);
    }
  }

  static async cancelMealReminders(): Promise<void> {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();

      for (const notification of scheduled) {
        if (notification.content.data?.type === "meal_reminder") {
          await Notifications.cancelScheduledNotificationAsync(
            notification.identifier,
          );
        }
      }

      console.log("✅ Meal reminders cancelled");
    } catch (error) {
      console.error("💥 Error cancelling meal reminders:", error);
    }
  }

  static async showTestNotification(): Promise<void> {
    try {
      await this.sendInstantNotification(
        "🧪 Test Notification",
        "Your notification system is working perfectly!",
        { type: "test", timestamp: Date.now() },
      );
    } catch (error) {
      console.error("💥 Error showing test notification:", error);
    }
  }

  static async getSettings(): Promise<NotificationSettings> {
    try {
      const settings = await AsyncStorage.getItem("notification_settings");
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
        "notification_settings",
        JSON.stringify(settings),
      );
    } catch (error) {
      console.error("Error saving notification settings:", error);
    }
  }

  static async initializeNotifications(userQuestionnaire?: any): Promise<void> {
    try {
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

      console.log("✅ Notification system initialized successfully");
    } catch (error) {
      console.error("💥 Error initializing notification system:", error);
    }
  }

  static getStatus(): {
    initialized: boolean;
    hasPushToken: boolean;
    pushToken: string | null;
  } {
    return {
      initialized: this.isInitialized,
      hasPushToken: !!this.expoPushToken,
      pushToken: this.expoPushToken,
    };
  }

  static async scheduleMealReminders(
    settings: NotificationSettings,
  ): Promise<void> {
    if (!settings.mealReminders) {
      console.log("⏭️ Meal reminders disabled, skipping...");
      return;
    }

    await this.cancelMealReminders();

    for (const time of settings.reminderTimes) {
      const [hours, minutes] = time.split(":").map(Number);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Meal Reminder 🍽️",
          body: "Don't forget to log your meal!",
          data: { type: "meal_reminder", time },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          repeats: true,
          hour: hours,
          minute: minutes,
        },
      });
    }

    console.log(`✅ Scheduled ${settings.reminderTimes.length} meal reminders`);
  }

  static async scheduleEndOfDayMealCheck(): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Daily Check-in ⏰",
        body: "Have you logged all your meals today? Track your nutrition before the day ends!",
        data: { type: "end_of_day_check" },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        repeats: true,
        hour: 21,
        minute: 0,
      },
    });

    console.log("✅ End of day check scheduled for 9:00 PM");
  }

  static getPushToken(): string | null {
    return this.expoPushToken;
  }
}
