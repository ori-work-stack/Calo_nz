import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Configure notifications behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class PushNotificationService {
  static async registerForPushNotifications() {
    // Skip push notifications in Expo Go to avoid warnings
    if (__DEV__ && !Device.isDevice) {
      console.log("⚠️ Skipping push notifications in Expo Go development mode");
      return null;
    }

    // Skip push notifications in Expo Go
    if (!Device.isDevice || __DEV__) {
      console.log("Push notifications not available in Expo Go or development");
      return null;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return null;
    }

    try {
      // Try to get project ID from multiple sources
      let projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ||
        Constants?.easConfig?.projectId ||
        "calo-nutrition-app-2025"; // Use the actual project ID from app.json

      // If still not found, try from app config
      if (!projectId && Constants?.expoConfig?.extra) {
        projectId = Constants.expoConfig.extra.eas?.projectId;
      }

      if (!projectId) {
        console.warn("⚠️ No project ID found for push notifications");
        // In development, this is expected
        if (__DEV__) {
          return null;
        }
      }

      let token;
      try {
        token = await Notifications.getExpoPushTokenAsync({
          projectId,
        });
      } catch (tokenError: any) {
        console.warn("⚠️ Failed to get push token:", tokenError);

        // In development with Expo Go, this is expected
        if (__DEV__) {
          console.log(
            "📱 Push tokens not available in Expo Go - this is normal"
          );
          return null;
        }

        throw tokenError;
      }

      console.log(
        "✅ Push token obtained:",
        token.data.substring(0, 20) + "..."
      );
      await AsyncStorage.setItem("expo_push_token", token.data);
      return token.data;
    } catch (error) {
      console.error("Error getting push token:", error);
      return null;
    }
  }

  static async scheduleMealReminders(userQuestionnaire: any) {
    try {
      // Cancel existing notifications first
      await Notifications.cancelAllScheduledNotificationsAsync();

      if (!userQuestionnaire?.meal_times) {
        console.log("No meal times configured in questionnaire");
        return;
      }

      const mealTimes = userQuestionnaire.meal_times
        .split(",")
        .map((time: string) => time.trim());
      const mealNames = ["Breakfast", "Lunch", "Dinner", "Snack", "Late Snack"];

      for (let i = 0; i < mealTimes.length; i++) {
        const timeStr = mealTimes[i];
        const [hours, minutes] = timeStr.split(":").map(Number);

        if (isNaN(hours) || isNaN(minutes)) {
          console.log(`Invalid time format: ${timeStr}`);
          continue;
        }

        const mealName = mealNames[i] || `Meal ${i + 1}`;

        await Notifications.scheduleNotificationAsync({
          content: {
            title: `🍽️ ${mealName} Time!`,
            body: `Don't forget to log your ${mealName.toLowerCase()} and track your nutrition!`,
            sound: true,
            data: {
              type: "meal_reminder",
              mealType: mealName,
              mealIndex: i,
              time: timeStr,
            },
          },
          trigger: {
            hour: hours,
            minute: minutes,
            repeats: true,
          },
        });
      }

      console.log(`Scheduled ${mealTimes.length} meal reminders`);
    } catch (error) {
      console.error("Error scheduling meal reminders:", error);
    }
  }

  static async scheduleMenuRatingReminder(menuId: string, menuName: string) {
    try {
      const userQuestionnaire = await AsyncStorage.getItem(
        "user_questionnaire"
      );
      if (!userQuestionnaire) return;

      const questionnaire = JSON.parse(userQuestionnaire);
      const mealTimes =
        questionnaire.meal_times
          ?.split(",")
          .map((time: string) => time.trim()) || [];

      for (let i = 0; i < mealTimes.length; i++) {
        const timeStr = mealTimes[i];
        const [hours, minutes] = timeStr.split(":").map(Number);

        if (isNaN(hours) || isNaN(minutes)) continue;

        // Schedule rating reminder 1 hour after meal time
        let reminderHours = hours + 1;
        let reminderMinutes = minutes;

        if (reminderHours >= 24) {
          reminderHours -= 24;
        }

        await Notifications.scheduleNotificationAsync({
          content: {
            title: "⭐ Rate Your Meal Experience",
            body: `How was your meal from ${menuName}? Your feedback helps us improve!`,
            sound: true,
            data: {
              type: "menu_rating",
              menuId,
              menuName,
              mealIndex: i,
            },
          },
          trigger: {
            hour: reminderHours,
            minute: reminderMinutes,
            repeats: true,
          },
        });
      }

      console.log(`Scheduled rating reminders for menu: ${menuName}`);
    } catch (error) {
      console.error("Error scheduling menu rating reminders:", error);
    }
  }

  static async scheduleWaterReminder() {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Stay Hydrated! 💧",
          body: "Time to drink some water and log your intake!",
          sound: true,
          data: { type: "water_reminder" },
        },
        trigger: {
          seconds: 2 * 60 * 60, // Every 2 hours
          repeats: true,
        },
      });
    } catch (error) {
      console.error("Error scheduling water reminder:", error);
    }
  }

  static async scheduleWeeklyProgress() {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Weekly Progress 📊",
          body: "Check out your nutrition progress this week!",
          sound: true,
          data: { type: "weekly_progress" },
        },
        trigger: {
          weekday: 1, // Monday
          hour: 9,
          minute: 0,
          repeats: true,
        },
      });
    } catch (error) {
      console.error("Error scheduling weekly progress reminder:", error);
    }
  }

  static async initializeNotifications(userQuestionnaire?: any) {
    try {
      // Skip initialization in Expo Go
      if (__DEV__ && !Device.isDevice) {
        console.log("⚠️ Skipping notification initialization in Expo Go");
        return null;
      }

      const token = await this.registerForPushNotifications();

      if (token && userQuestionnaire) {
        await this.scheduleMealReminders(userQuestionnaire);
        await this.scheduleWaterReminder();
        await this.scheduleWeeklyProgress();
      }

      return token;
    } catch (error) {
      console.error("Error initializing push notifications:", error);
      return null;
    }
  }
}
