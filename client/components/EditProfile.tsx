import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Platform,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/src/store";
import { Ionicons } from "@expo/vector-icons";
import { userAPI } from "@/src/services/api";
import { signOut } from "@/src/store/authSlice";
import DateTimePicker from "@react-native-community/datetimepicker";

interface EditProfileProps {
  onClose: () => void;
}

export default function EditProfile({ onClose }: EditProfileProps) {
  const { t, i18n } = useTranslation();
  const { isRTL } = useLanguage();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    birth_date: user?.birth_date || "",
  });
  const [date, setDate] = useState(
    profile.birth_date ? new Date(profile.birth_date) : new Date()
  );
  const [showPicker, setShowPicker] = useState(false);

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === "ios");
    if (selectedDate) {
      setDate(selectedDate);
      setProfile({
        ...profile,
        birth_date: selectedDate.toISOString().split("T")[0],
      });
    }
  };

  const handleSave = () => {
    userAPI.updateProfile(profile);
    Alert.alert(t("common.save"), t("profile.save_success"), [
      { text: t("common.done"), onPress: onClose },
    ]);
  };

  const handleImagePicker = () => {
    Alert.alert(t("profile.changeAvatar"), t("profile.selectImageSource"), [
      { text: t("camera.takePhoto"), onPress: () => console.log("Camera") },
      {
        text: t("camera.selectFromGallery"),
        onPress: () => console.log("Gallery"),
      },
      { text: t("common.cancel"), style: "cancel" },
    ]);
  };

  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteAccount = async () => {
    const confirmWord = t("profile.deleteConfirmWord");
    if (deleteConfirmText !== confirmWord) {
      Alert.alert(
        t("common.error"),
        t("profile.deleteConfirmError", { confirmWord })
      );
      return;
    }

    try {
      const response = await userAPI.deleteAccount();
      if (response.success) {
        Alert.alert(t("common.success"), t("profile.accountDeleted"), [
          {
            text: t("common.ok"),
            onPress: () => {
              dispatch(signOut());
            },
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert(
        t("common.error"),
        error.message || t("profile.deleteAccountError")
      );
    }
  };

  return (
    <ScrollView style={[styles.container, isRTL && styles.containerRTL]}>
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={[styles.title, isRTL && styles.titleRTL]}>
          {t("profile.edit_profile")}
        </Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveButton}>{t("common.save")}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handleImagePicker}>
            <Image
              source={{
                uri: user?.avatar_url || "https://via.placeholder.com/100",
              }}
              style={styles.avatar}
            />
            <View style={styles.avatarOverlay}>
              <Ionicons name="camera" size={20} color="white" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isRTL && styles.labelRTL]}>
              {t("profile.name")}
            </Text>
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              value={profile.name}
              onChangeText={(text) => setProfile({ ...profile, name: text })}
              placeholder={t("profile.enterName")}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, isRTL && styles.labelRTL]}>
              {t("auth.email")}
            </Text>
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              value={profile.email}
              onChangeText={(text) => setProfile({ ...profile, email: text })}
              placeholder={t("profile.enterEmail")}
              keyboardType="email-address"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isRTL && styles.labelRTL]}>
              {t("auth.birth_date")}
            </Text>

            <TouchableOpacity
              style={[styles.input, { justifyContent: "center" }]}
              onPress={() => setShowPicker(true)}
            >
              <Text>{date.toISOString().split("T")[0]}</Text>
            </TouchableOpacity>

            {showPicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={onChangeDate}
                maximumDate={new Date()}
              />
            )}
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerZone}>
          <Text style={[styles.dangerTitle, isRTL && styles.labelRTL]}>
            {t("profile.dangerZone")}
          </Text>

          {!showDeleteConfirm ? (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => setShowDeleteConfirm(true)}
            >
              <Ionicons name="warning" size={20} color="white" />
              <Text style={styles.deleteButtonText}>
                {t("profile.deleteAccount")}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.deleteConfirmSection}>
              <Text style={[styles.deleteWarning, isRTL && styles.labelRTL]}>
                {t("profile.deleteConfirmMessage")}
              </Text>
              <TextInput
                style={[styles.input, isRTL && styles.inputRTL]}
                value={deleteConfirmText}
                onChangeText={setDeleteConfirmText}
                placeholder={t("profile.deleteConfirmWord")}
                autoCapitalize="characters"
              />
              <View style={styles.deleteActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText("");
                  }}
                >
                  <Text style={styles.cancelButtonText}>
                    {t("common.cancel")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmDeleteButton}
                  onPress={handleDeleteAccount}
                >
                  <Text style={styles.confirmDeleteButtonText}>
                    {t("profile.confirmDelete")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  containerRTL: {
    direction: "rtl",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerRTL: {
    flexDirection: "row-reverse",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  titleRTL: {
    textAlign: "right",
  },
  saveButton: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: "white",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e9ecef",
  },
  avatarOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 6,
  },
  formSection: {
    backgroundColor: "white",
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  labelRTL: {
    textAlign: "right",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f8f9fa",
    ...Platform.select({
      web: {
        width: "100%",
      },
    }),
  },
  inputRTL: {
    textAlign: "right",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  dangerZone: {
    marginTop: 32,
    padding: 16,
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#DC2626",
    marginBottom: 12,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#DC2626",
    padding: 12,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteConfirmSection: {
    gap: 12,
  },
  deleteWarning: {
    fontSize: 14,
    color: "#991B1B",
    fontWeight: "500",
  },
  deleteActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  confirmDeleteButton: {
    flex: 1,
    padding: 12,
    backgroundColor: "#DC2626",
    borderRadius: 8,
    alignItems: "center",
  },
  confirmDeleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});
