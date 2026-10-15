import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "in.bhavyladani.lockkaro",
  appName: "LockKaro",
  // `next build` writes the static export here (output: "export").
  webDir: "out",
  plugins: {
    // Off until the user turns on App lock (features/security/app-lock.ts).
    PrivacyScreen: { enable: false },
    LocalNotifications: { smallIcon: "ic_stat_lock", iconColor: "#F59E0B" },
  },
};

export default config;
