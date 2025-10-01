import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import {
  Plus,
  CreditCard as Edit3,
  Trash2,
  ShoppingCart,
  ChefHat,
} from "lucide-react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useShoppingList } from "@/hooks/useShoppingList";
import { LinearGradient } from "expo-linear-gradient";

interface Ingredient {
  name: string;
  calories: number;
  protein_g?: number;
  protein?: number;
  carbs_g?: number;
  carbs?: number;
  fats_g?: number;
  fat?: number;
  fats?: number;
  fiber_g?: number;
  fiber?: number;
  sugar_g?: number;
  sugar?: number;
  sodium_mg?: number;
  sodium?: number;
  estimated_portion_g?: number;
}

interface IngredientsListProps {
  ingredients: Ingredient[];
  onEditIngredient: (ingredient: Ingredient, index: number) => void;
  onRemoveIngredient: (index: number) => void;
  onAddIngredient: () => void;
}

export const IngredientsList: React.FC<IngredientsListProps> = ({
  ingredients,
  onEditIngredient,
  onRemoveIngredient,
  onAddIngredient,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { addItem, bulkAddItems, isAddingItem, isBulkAdding } =
    useShoppingList();
  const [addingToShoppingList, setAddingToShoppingList] = useState<
    string | null
  >(null);

  const getNutritionValue = (ingredient: Ingredient, field: string): number => {
    const variations = [
      field,
      field.replace("_g", ""),
      field.replace("_mg", ""),
      field.replace("g", ""),
      field.replace("mg", ""),
    ];

    for (const variation of variations) {
      const value = ingredient[variation as keyof Ingredient];
      if (typeof value === "number" && value > 0) {
        return Math.round(value);
      }
      if (typeof value === "string" && !isNaN(parseFloat(value))) {
        return Math.round(parseFloat(value));
      }
    }
    return 0;
  };

  const handleAddToShoppingList = async (
    ingredient: Ingredient,
    index: number
  ) => {
    setAddingToShoppingList(`${index}`);
    try {
      addItem({
        name: ingredient.name,
        quantity: ingredient.estimated_portion_g
          ? Math.round(ingredient.estimated_portion_g)
          : 1,
        unit: ingredient.estimated_portion_g ? "grams" : "pieces",
        category: "From Meal Analysis",
        added_from: "meal",
        is_purchased: undefined,
      });
      Alert.alert("Success", `${ingredient.name} added to shopping list!`);
    } catch (error) {
      Alert.alert("Error", "Failed to add item to shopping list");
    } finally {
      setAddingToShoppingList(null);
    }
  };

  const handleAddAllToShoppingList = async () => {
    setAddingToShoppingList("all");
    try {
      const itemsToAdd = ingredients.map((ingredient) => ({
        name: ingredient.name,
        quantity: ingredient.estimated_portion_g
          ? Math.round(ingredient.estimated_portion_g)
          : 1,
        unit: ingredient.estimated_portion_g ? "grams" : "pieces",
        category: "From Meal Analysis",
        added_from: "meal",
      }));
      bulkAddItems(itemsToAdd);
      Alert.alert(
        "Success",
        `${ingredients.length} ingredients added to shopping list!`
      );
    } catch (error) {
      Alert.alert("Error", "Failed to add ingredients to shopping list");
    } finally {
      setAddingToShoppingList(null);
    }
  };

  if (ingredients.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <ChefHat size={20} color="#10B981" />
          </View>
          <View>
            <Text style={styles.title}>Ingredients</Text>
            <Text style={styles.subtitle}>
              {ingredients.length} items detected
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          {ingredients.length > 0 && (
            <TouchableOpacity
              style={styles.addAllButton}
              onPress={handleAddAllToShoppingList}
              disabled={isBulkAdding || addingToShoppingList === "all"}
            >
              <ShoppingCart size={16} color="#3B82F6" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.addButton} onPress={onAddIngredient}>
            <Plus size={18} color="#10B981" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.ingredientsList}>
        {ingredients.map((ingredient, index) => (
          <View key={index} style={styles.ingredientCard}>
            <TouchableOpacity
              style={styles.ingredientContent}
              onPress={() => handleAddToShoppingList(ingredient, index)}
              activeOpacity={0.7}
            >
              <View style={styles.ingredientMain}>
                <Text style={styles.ingredientName}>
                  {typeof ingredient === "string"
                    ? ingredient
                    : ingredient.name}
                </Text>
                {typeof ingredient !== "string" && (
                  <View style={styles.nutritionBadges}>
                    <View style={[styles.nutritionBadge, styles.caloriesBadge]}>
                      <Text style={styles.badgeText}>
                        {getNutritionValue(ingredient, "calories")} cal
                      </Text>
                    </View>
                    <View style={[styles.nutritionBadge, styles.proteinBadge]}>
                      <Text style={styles.badgeText}>
                        {getNutritionValue(ingredient, "protein")}g protein
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <View style={styles.ingredientActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.shopButton]}
                onPress={() => handleAddToShoppingList(ingredient, index)}
                disabled={isAddingItem || addingToShoppingList === `${index}`}
              >
                <ShoppingCart size={16} color="#3B82F6" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => onEditIngredient(ingredient, index)}
              >
                <Edit3 size={16} color="#F59E0B" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => onRemoveIngredient(index)}
              >
                <Trash2 size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A2744",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7E99",
    fontWeight: "500",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  addAllButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
  },
  ingredientsList: {
    gap: 10,
  },
  ingredientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  ingredientContent: {
    flex: 1,
  },
  ingredientMain: {
    gap: 8,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A2744",
    marginBottom: 4,
  },
  nutritionBadges: {
    flexDirection: "row",
    gap: 8,
  },
  nutritionBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  caloriesBadge: {
    backgroundColor: "#FEF2F2",
  },
  proteinBadge: {
    backgroundColor: "#EFF6FF",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7E99",
  },
  ingredientActions: {
    flexDirection: "row",
    gap: 6,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  shopButton: {
    backgroundColor: "#EFF6FF",
  },
  editButton: {
    backgroundColor: "#FFFBEB",
  },
  deleteButton: {
    backgroundColor: "#FEF2F2",
  },
});
