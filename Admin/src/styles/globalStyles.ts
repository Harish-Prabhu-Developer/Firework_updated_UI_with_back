// Admin/src/styles/globalStyles.ts
import { StyleSheet, Platform } from "react-native";
import { LightColors } from "./colors";

const colors = LightColors;

export const Fonts = {
  display: Platform.select({
    android: "sans-serif",
    web: "'Plus Jakarta Sans', sans-serif",
    default: "System",
  }),

  body: Platform.select({
    android: "sans-serif",
    web: "'DM Sans', sans-serif",
    default: "System",
  }),
};

export const Radius = {
  sm: 6,
  md: 10,
  lg: 12,
  xl: 16,
  '2xl': 20,
  xxl: 20,
  '3xl': 28,
  xxxl: 28,
  full: 999,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const globalStyles = StyleSheet.create({
  flex1: {
    flex: 1,
  },

  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: Radius.xl,
    padding: 20,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 3,
  },

  pageHeader: {
    marginBottom: 24,
  },

  pageTitle: {
    fontSize: FontSizes.xxl,
    fontFamily: Fonts.display,
    fontWeight: "700",
    color: colors.foreground,
  },

  pageDescription: {
    marginTop: 4,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.body,
    color: colors.mutedForeground,
  },

  text: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.body,
    color: colors.foreground,
  },

  mutedText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.body,
    color: colors.mutedForeground,
  },

  heading1: {
    fontSize: 32,
    fontWeight: "800",
    fontFamily: Fonts.display,
    color: colors.foreground,
  },

  heading2: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: Fonts.display,
    color: colors.foreground,
  },

  heading3: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: Fonts.display,
    color: colors.foreground,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    backgroundColor: colors.card,
    color: colors.foreground,
    fontFamily: Fonts.body,
  },

  buttonPrimary: {
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  buttonPrimaryText: {
    color: colors.primaryForeground,
    fontSize: FontSizes.md,
    fontWeight: "600",
    fontFamily: Fonts.body,
  },

  buttonSecondary: {
    height: 48,
    backgroundColor: colors.secondary,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  buttonSecondaryText: {
    color: colors.secondaryForeground,
    fontSize: FontSizes.md,
    fontWeight: "600",
    fontFamily: Fonts.body,
  },

  border: {
    borderColor: colors.border,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
  },

  successBox: {
    backgroundColor: colors.success,
    borderRadius: Radius.md,
    padding: 12,
  },

  warningBox: {
    backgroundColor: colors.warning,
    borderRadius: Radius.md,
    padding: 12,
  },

  infoBox: {
    backgroundColor: colors.info,
    borderRadius: Radius.md,
    padding: 12,
  },

  sidebar: {
    flex: 1,
    backgroundColor: colors.sidebarBackground,
  },

  sidebarText: {
    color: colors.sidebarForeground,
    fontFamily: Fonts.body,
  },

  required: {
    color: colors.destructive,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  center: {
    alignItems: "center",
    justifyContent: "center",
  },

  shadowSm: {
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 2,
  },
});
