import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.rentnearn.app",
  appName: "RentNEarn",
  // Vite builds to dist/public inside the rentmitra artifact directory.
  webDir: "dist/public",
  // When running inside the native shell, serve files from disk
  // (no live-reload server). Remove or adjust for local dev if needed.
  server: {
    androidScheme: "https",
  },
};

export default config;
