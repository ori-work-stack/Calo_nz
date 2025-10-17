import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { BaseToast, ErrorToast, InfoToast } from "react-native-toast-message";

export const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={styles.successToast}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      text2NumberOfLines={3}
      renderLeadingIcon={() => (
        <View style={styles.successIcon}>
          <Text style={styles.iconText}>✅</Text>
        </View>
      )}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={styles.errorToast}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      text2NumberOfLines={3}
      renderLeadingIcon={() => (
        <View style={styles.errorIcon}>
          <Text style={styles.iconText}>❌</Text>
        </View>
      )}
    />
  ),
  info: (props: any) => (
    <InfoToast
      {...props}
      style={styles.infoToast}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      text2NumberOfLines={3}
      renderLeadingIcon={() => (
        <View style={styles.infoIcon}>
          <Text style={styles.iconText}>ℹ️</Text>
        </View>
      )}
    />
  ),
  warning: (props: any) => (
    <BaseToast
      {...props}
      style={styles.warningToast}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      text2NumberOfLines={3}
      renderLeadingIcon={() => (
        <View style={styles.warningIcon}>
          <Text style={styles.iconText}>⚠️</Text>
        </View>
      )}
    />
  ),
};

const styles = StyleSheet.create({
  successToast: {
    borderLeftColor: "#10b981",
    borderLeftWidth: 6,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    height: "auto",
    minHeight: 60,
    paddingVertical: 12,
  },
  errorToast: {
    borderLeftColor: "#ef4444",
    borderLeftWidth: 6,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    height: "auto",
    minHeight: 60,
    paddingVertical: 12,
  },
  infoToast: {
    borderLeftColor: "#3b82f6",
    borderLeftWidth: 6,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    height: "auto",
    minHeight: 60,
    paddingVertical: 12,
  },
  warningToast: {
    borderLeftColor: "#f59e0b",
    borderLeftWidth: 6,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    height: "auto",
    minHeight: 60,
    paddingVertical: 12,
  },
  contentContainer: {
    paddingHorizontal: 15,
  },
  text1: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  text2: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  successIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#d1fae5",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  errorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fee2e2",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  warningIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fef3c7",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  iconText: {
    fontSize: 20,
  },
});
