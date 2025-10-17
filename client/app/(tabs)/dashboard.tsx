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
  Modal,
  ActivityIndicator,
} from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "@/src/store";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { Shield } from "lucide-react-native"; // Icon updated as per the changes.

const ADMIN_PLAN = "ADMIN"; // Set the plan name that can access admin dashboard

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

interface User {
  user_id: string;
  email: string;
  name: string;
  subscription_type: string;
  created_at: string;
  email_verified: boolean;
  is_questionnaire_completed: boolean;
  level: number;
  total_points: number;
  current_streak: number;
  _count: {
    meals: number;
    recommendedMenus: number;
  };
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { language, isRTL } = useLanguage();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    // Check if user has admin access
    console.log("👤 Current user:", user);
    console.log("🔑 Is admin:", user?.is_admin);
    console.log("🔑 Is super admin:", user?.is_super_admin);

    if (!user || (!user.is_admin && !user.is_super_admin)) {
      console.log("🚫 Unauthorized access attempt to admin dashboard");
      Alert.alert("Access Denied", "You do not have admin privileges", [
        { text: "OK", onPress: () => router.replace("/(tabs)") },
      ]);
      return;
    }

    console.log("✅ Admin access granted, fetching data...");
    fetchAdminData();
  }, [user, router]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.EXPO_PUBLIC_API_URL;

      // Get the auth token
      const { authAPI } = await import("@/src/services/api");
      const token = await authAPI.getStoredToken();

      if (!token) {
        console.error("❌ No auth token found");
        Alert.alert("Error", "Please sign in again");
        router.replace("/(auth)/welcome");
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const [statsRes, usersRes] = await Promise.all([
        axios.get(`${API_URL}/admin/stats`, config),
        axios.get(
          `${API_URL}/admin/users?page=${currentPage}&limit=20`,
          config
        ),
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }

      if (usersRes.data.success) {
        setUsers(usersRes.data.data.users);
        setTotalPages(usersRes.data.data.pagination.totalPages);
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

  const handleUserDetails = async (userId: string) => {
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL;
      const { authAPI } = await import("@/src/services/api");
      const token = await authAPI.getStoredToken();

      const response = await axios.get(`${API_URL}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setSelectedUser(response.data.data);
        setShowUserModal(true);
      }
    } catch (error) {
      console.error("Failed to fetch user details:", error);
      Alert.alert("Error", "Failed to load user details");
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    const confirmWord = language === "he" ? "מחק" : "DELETE";
    if (deleteConfirmText !== confirmWord) {
      Alert.alert(
        t("common.error"),
        language === "he"
          ? `אנא הקלד "${confirmWord}" לאישור`
          : `Please type "${confirmWord}" to confirm`
      );
      return;
    }

    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL;
      const { authAPI } = await import("@/src/services/api");
      const token = await authAPI.getStoredToken();

      const response = await axios.delete(
        `${API_URL}/admin/users/${selectedUser.user_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        Alert.alert(
          t("common.success"),
          language === "he" ? "המשתמש נמחק בהצלחה" : "User deleted successfully"
        );
        setShowUserModal(false);
        setDeleteConfirmText("");
        fetchAdminData();
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      Alert.alert("Error", "Failed to delete user");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>
          {language === "he" ? "טוען נתונים..." : "Loading..."}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, isRTL && styles.textRTL]}>
            {t("admin.dashboard")}
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#333" />
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
            <View style={styles.subscriptionsCard}>
              <Text style={styles.cardTitle}>{t("admin.subscriptions")}</Text>
              {Object.entries(stats.subscriptions).map(([type, count]) => (
                <View key={type} style={styles.subscriptionRow}>
                  <Text style={styles.subscriptionType}>{type}</Text>
                  <Text style={styles.subscriptionCount}>{count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Users Section */}
        <View style={styles.usersSection}>
          <Text style={styles.sectionTitle}>{t("admin.users")}</Text>

          <TextInput
            style={styles.searchInput}
            placeholder={language === "he" ? "חפש משתמש..." : "Search users..."}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {filteredUsers.map((user) => (
            <TouchableOpacity
              key={user.user_id}
              style={styles.userCard}
              onPress={() => handleUserDetails(user.user_id)}
            >
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name || "No Name"}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <View style={styles.userStats}>
                  <Text style={styles.userStat}>
                    {user.subscription_type} • {user._count.meals} meals
                  </Text>
                  <Text style={styles.userStat}>
                    Level {user.level} • {user.total_points} XP
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#999" />
            </TouchableOpacity>
          ))}

          {/* Pagination */}
          <View style={styles.pagination}>
            <TouchableOpacity
              disabled={currentPage === 1}
              onPress={() => {
                setCurrentPage((p) => p - 1);
                fetchAdminData();
              }}
              style={[
                styles.paginationButton,
                currentPage === 1 && styles.paginationButtonDisabled,
              ]}
            >
              <Text>Previous</Text>
            </TouchableOpacity>

            <Text style={styles.paginationText}>
              Page {currentPage} of {totalPages}
            </Text>

            <TouchableOpacity
              disabled={currentPage === totalPages}
              onPress={() => {
                setCurrentPage((p) => p + 1);
                fetchAdminData();
              }}
              style={[
                styles.paginationButton,
                currentPage === totalPages && styles.paginationButtonDisabled,
              ]}
            >
              <Text>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* User Details Modal */}
      <Modal visible={showUserModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedUser && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {language === "he" ? "פרטי משתמש" : "User Details"}
                  </Text>
                  <TouchableOpacity onPress={() => setShowUserModal(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{selectedUser.email}</Text>

                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>
                    {selectedUser.name || "N/A"}
                  </Text>

                  <Text style={styles.detailLabel}>Subscription:</Text>
                  <Text style={styles.detailValue}>
                    {selectedUser.subscription_type}
                  </Text>

                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text style={styles.detailValue}>
                    Email: {selectedUser.email_verified ? "✅" : "❌"} |
                    Questionnaire:{" "}
                    {selectedUser.is_questionnaire_completed ? "✅" : "❌"}
                  </Text>

                  <Text style={styles.detailLabel}>Stats:</Text>
                  <Text style={styles.detailValue}>
                    Level {selectedUser.level} • {selectedUser.total_points} XP
                    • Streak {selectedUser.current_streak}
                  </Text>

                  {/* Delete User Section */}
                  <View style={styles.dangerZone}>
                    <Text style={styles.dangerTitle}>
                      {language === "he" ? "מחיקת משתמש" : "Delete User"}
                    </Text>
                    <Text style={styles.dangerWarning}>
                      {language === "he"
                        ? `הקלד "${
                            language === "he" ? "מחק" : "DELETE"
                          }" לאישור`
                        : 'Type "DELETE" to confirm'}
                    </Text>
                    <TextInput
                      style={styles.dangerInput}
                      value={deleteConfirmText}
                      onChangeText={setDeleteConfirmText}
                      placeholder={language === "he" ? "מחק" : "DELETE"}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={handleDeleteUser}
                    >
                      <Text style={styles.deleteButtonText}>
                        {t("admin.deleteUser")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  textRTL: {
    textAlign: "right",
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
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
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
    color: "#333",
  },
  subscriptionCount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007AFF",
  },
  usersSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  searchInput: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  userCard: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  userStats: {
    marginTop: 8,
  },
  userStat: {
    fontSize: 12,
    color: "#999",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 16,
  },
  paginationButton: {
    padding: 12,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  paginationButtonDisabled: {
    backgroundColor: "#CCC",
  },
  paginationText: {
    fontSize: 14,
    color: "#666",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  modalBody: {
    padding: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: "#333",
  },
  dangerZone: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#DC2626",
    marginBottom: 8,
  },
  dangerWarning: {
    fontSize: 14,
    color: "#991B1B",
    marginBottom: 12,
  },
  dangerInput: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    marginBottom: 12,
  },
  deleteButton: {
    backgroundColor: "#DC2626",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});
