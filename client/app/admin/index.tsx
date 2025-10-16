import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "@/src/store";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/context/ThemeContext";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";

interface AdminStats {
  overview: {
    totalUsers: number;
    todaySignups: number;
    todayLogins: number;
    totalMeals: number;
    totalMenus: number;
  };
  subscriptions: Record<string, number>;
  revenue: {
    total: number;
    transactions: number;
  };
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user || (!user.is_admin && !user.is_super_admin)) {
      Alert.alert(t("admin.accessDenied"), t("admin.noPermission"), [
        { text: "OK", onPress: () => router.replace("/(tabs)") },
      ]);
      return;
    }

    fetchAdminData();
  }, [user]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.EXPO_PUBLIC_API_URL;

      const response = await axios.get(`${API_URL}/admin/stats`);

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
      Alert.alert("Error", "Failed to load admin data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAdminData();
  };

  if (loading && !refreshing) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          {t("common.loading")}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {t("admin.dashboard")}
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: colors.textSecondary }]}
            >
              Admin Control Panel
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/admin/settings")}
            style={styles.settingsButton}
          >
            <Ionicons name="settings-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/admin/users")}
          >
            <Ionicons name="people" size={24} color="#FFF" />
            <Text style={styles.actionButtonText}>{t("admin.users")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.success }]}
            onPress={() => fetchAdminData()}
          >
            <Ionicons name="refresh" size={24} color="#FFF" />
            <Text style={styles.actionButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: "#E3F2FD" }]}>
                <Ionicons name="people" size={32} color="#1976D2" />
                <Text style={styles.statValue}>
                  {stats.overview.totalUsers}
                </Text>
                <Text style={styles.statLabel}>{t("admin.totalUsers")}</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: "#E8F5E9" }]}>
                <Ionicons name="person-add" size={32} color="#388E3C" />
                <Text style={styles.statValue}>
                  {stats.overview.todaySignups}
                </Text>
                <Text style={styles.statLabel}>{t("admin.todaySignups")}</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: "#FFF3E0" }]}>
                <Ionicons name="log-in" size={32} color="#F57C00" />
                <Text style={styles.statValue}>
                  {stats.overview.todayLogins}
                </Text>
                <Text style={styles.statLabel}>{t("admin.todayLogins")}</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: "#FCE4EC" }]}>
                <Ionicons name="restaurant" size={32} color="#C2185B" />
                <Text style={styles.statValue}>
                  {stats.overview.totalMeals}
                </Text>
                <Text style={styles.statLabel}>{t("admin.totalMeals")}</Text>
              </View>
            </View>

            {/* Revenue Card */}
            <View
              style={[styles.fullWidthCard, { backgroundColor: "#F3E5F5" }]}
            >
              <Ionicons name="cash" size={32} color="#7B1FA2" />
              <Text style={styles.statValue}>
                ${stats.revenue.total.toFixed(2)}
              </Text>
              <Text style={styles.statLabel}>
                {t("admin.revenue")} ({stats.revenue.transactions} transactions)
              </Text>
            </View>

            {/* Subscriptions Breakdown */}
            <View
              style={[
                styles.subscriptionsCard,
                { backgroundColor: colors.card },
              ]}
            >
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {t("admin.subscriptions")}
              </Text>
              {Object.entries(stats.subscriptions).map(([type, count]) => (
                <View key={type} style={styles.subscriptionRow}>
                  <Text
                    style={[styles.subscriptionType, { color: colors.text }]}
                  >
                    {type}
                  </Text>
                  <Text
                    style={[
                      styles.subscriptionCount,
                      { color: colors.primary },
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  settingsButton: {
    padding: 8,
  },
  quickActions: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  statsContainer: {
    padding: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  fullWidthCard: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 8,
    color: "#333",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  subscriptionsCard: {
    padding: 16,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  subscriptionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  subscriptionType: {
    fontSize: 16,
  },
  subscriptionCount: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
