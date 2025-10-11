import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/context/ThemeContext";
import { nutritionAPI } from "@/src/services/api";
import { X, Plus, Save, Camera } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

interface ManualMealAdditionProps {
  visible: boolean;
  onClose: () => void;
  onMealAdded: () => void;
}

const MEAL_PERIODS = [
  { value: "breakfast", label: "history.mealPeriods.breakfast", icon: "🌅" },
  { value: "lunch", label: "history.mealPeriods.lunch", icon: "☀️" },
  { value: "dinner", label: "history.mealPeriods.dinner", icon: "🌙" },
  { value: "snack", label: "history.mealPeriods.snack", icon: "🍎" },
  {
    value: "late_night",
    label: "history.mealPeriods.lateNight",
    icon: "🌃",
  },
  { value: "other", label: "history.mealPeriods.other", icon: "🍽️" },
];

export default function ManualMealAddition({
  visible,
  onClose,
  onMealAdded,
}: ManualMealAdditionProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [isLoading, setIsLoading] = useState(false);
  const [mealData, setMealData] = useState({
    mealName: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    fiber: "",
    sugar: "",
    sodium: "",
    ingredients: "",
    mealPeriod: "other",
    imageUrl: "",
  });
  const { colors } = useTheme();
  const handleSubmit = async () => {
    if (!mealData.mealName.trim() || !mealData.calories.trim()) {
      Alert.alert(
        t("common.error"),
        t("history.manualMeal.error.nameAndCaloriesRequired")
      );
      return;
    }

    const caloriesNum = parseFloat(mealData.calories);
    if (isNaN(caloriesNum) || caloriesNum < 0) {
      Alert.alert(
        t("common.error"),
        t("history.manualMeal.error.invalidCalories")
      );
      return;
    }

    try {
      setIsLoading(true);

      const ingredientsArray = mealData.ingredients
        .split(",")
        .map((i) => i.trim())
        .filter((i) => i.length > 0);

      const response = await nutritionAPI.addManualMeal({
        mealName: mealData.mealName,
        calories: mealData.calories,
        protein: mealData.protein || "0",
        carbs: mealData.carbs || "0",
        fat: mealData.fat || "0",
        fiber: mealData.fiber,
        sugar: mealData.sugar,
        sodium: mealData.sodium,
        ingredients: ingredientsArray.length > 0 ? ingredientsArray : undefined,
        mealPeriod: mealData.mealPeriod,
        imageUrl: mealData.imageUrl,
        date: new Date().toISOString(),
      });

      if (response.status === 200 && response.data.success) {
        Alert.alert(
          t("common.success"),
          t("history.manualMeal.success.mealAdded")
        );
        setMealData({
          mealName: "",
          calories: "",
          protein: "",
          carbs: "",
          fat: "",
          fiber: "",
          sugar: "",
          sodium: "",
          ingredients: "",
          mealPeriod: "other",
          imageUrl: "",
        });
        onMealAdded();
        onClose();
      } else {
        throw new Error(response.data.error || "Failed to add meal");
      }
    } catch (error) {
      console.error("Failed to add manual meal:", error);
      Alert.alert(t("common.error"), t("history.manualMeal.error.addFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setMealData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <LinearGradient
            colors={["#10B981", "#059669"]}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>
              {t("history.manualMeal.title")}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              disabled={isLoading}
            >
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("history.manualMeal.basicInfo")}
              </Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {t("history.manualMeal.mealName")} *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={mealData.mealName}
                  onChangeText={(text) => updateField("mealName", text)}
                  placeholder={t("history.manualMeal.placeholders.mealName")}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {t("history.manualMeal.mealPeriod")}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.periodSelector}
                >
                  {MEAL_PERIODS.map((period) => (
                    <TouchableOpacity
                      key={period.value}
                      onPress={() => updateField("mealPeriod", period.value)}
                      style={[
                        styles.periodChip,
                        {
                          backgroundColor:
                            mealData.mealPeriod === period.value
                              ? "#10B981"
                              : colors.card,
                          borderColor:
                            mealData.mealPeriod === period.value
                              ? "#10B981"
                              : colors.border,
                        },
                      ]}
                    >
                      <Text style={styles.periodEmoji}>{period.icon}</Text>
                      <Text
                        style={[
                          styles.periodText,
                          {
                            color:
                              mealData.mealPeriod === period.value
                                ? "#FFFFFF"
                                : colors.text,
                          },
                        ]}
                      >
                        {t(period.label)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("history.manualMeal.nutritionInfo")}
              </Text>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    {t("nutrition.calories")} *
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.card,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    value={mealData.calories}
                    onChangeText={(text) => updateField("calories", text)}
                    placeholder="0"
                    keyboardType="decimal-pad"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={styles.halfInput}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    {t("nutrition.protein")} (g)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.card,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    value={mealData.protein}
                    onChangeText={(text) => updateField("protein", text)}
                    placeholder="0"
                    keyboardType="decimal-pad"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    {t("nutrition.carbs")} (g)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.card,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    value={mealData.carbs}
                    onChangeText={(text) => updateField("carbs", text)}
                    placeholder="0"
                    keyboardType="decimal-pad"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={styles.halfInput}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    {t("nutrition.fat")} (g)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.card,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    value={mealData.fat}
                    onChangeText={(text) => updateField("fat", text)}
                    placeholder="0"
                    keyboardType="decimal-pad"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    {t("nutrition.fiber")} (g)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.card,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    value={mealData.fiber}
                    onChangeText={(text) => updateField("fiber", text)}
                    placeholder="0"
                    keyboardType="decimal-pad"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={styles.halfInput}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    {t("nutrition.sugar")} (g)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.card,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    value={mealData.sugar}
                    onChangeText={(text) => updateField("sugar", text)}
                    placeholder="0"
                    keyboardType="decimal-pad"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {t("nutrition.sodium")} (mg)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={mealData.sodium}
                  onChangeText={(text) => updateField("sodium", text)}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("history.manualMeal.additionalInfo")}
              </Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {t("history.ingredients")}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    {
                      backgroundColor: colors.card,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={mealData.ingredients}
                  onChangeText={(text) => updateField("ingredients", text)}
                  placeholder={t("history.manualMeal.placeholders.ingredients")}
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
                <Text
                  style={[styles.helperText, { color: colors.textSecondary }]}
                >
                  {t("history.manualMeal.helpers.separateWithCommas")}
                </Text>
              </View>
            </View>
          </ScrollView>

          <View
            style={[styles.modalFooter, { backgroundColor: colors.background }]}
          >
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.card }]}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={[styles.cancelText, { color: colors.text }]}>
                {t("common.cancel")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitButton,
                isLoading && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <LinearGradient
                colors={["#10B981", "#059669"]}
                style={styles.submitGradient}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Save size={20} color="#FFFFFF" />
                    <Text style={styles.submitText}>{t("common.save")}</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    maxHeight: "90%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: "italic",
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  periodSelector: {
    marginTop: 8,
  },
  periodChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1.5,
    gap: 6,
  },
  periodEmoji: {
    fontSize: 16,
  },
  periodText: {
    fontSize: 13,
    fontWeight: "600",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    flex: 2,
    borderRadius: 12,
    overflow: "hidden",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  submitText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
