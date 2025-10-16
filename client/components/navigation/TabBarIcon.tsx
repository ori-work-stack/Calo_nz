import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ComponentProps } from "react";

type IoniconsName = ComponentProps<typeof Ionicons>["name"];

export function TabBarIcon({
  style,
  name,
  color,
  size = 28,
  ...rest
}: {
  name: IoniconsName;
  color: string;
  size?: number;
  style?: any;
}) {
  return (
    <Ionicons
      name={name}
      size={size}
      color={color}
      style={[{ marginBottom: -3 }, style]}
      {...rest}
    />
  );
}
