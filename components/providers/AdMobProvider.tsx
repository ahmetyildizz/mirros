"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { AdMobService } from "@/lib/services/admob.service";
import { App } from "@capacitor/app";

export function AdMobProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let isInitialized = false;

    const initAdMob = async () => {
      try {
        await AdMobService.initialize();
        isInitialized = true;
        // Pre-load units
        await AdMobService.prepareInterstitial();
        await AdMobService.prepareRewardAd();
      } catch (error) {
        console.error("AdMobProvider: Failed to init AdMob", error);
      }
    };

    initAdMob();

    // Emulate "App Open Ad" logic using Interstitials on App Resume
    const stateChangeListener = App.addListener("appStateChange", async ({ isActive }) => {
      if (isActive && isInitialized) {
        console.log("App resumed. Showing Welcome (App Open fallback) Ad.");
        await AdMobService.showInterstitial();
        // Prepare next one
        await AdMobService.prepareInterstitial();
      }
    });

    return () => {
      stateChangeListener.then(listener => listener.remove()).catch(console.error);
    };
  }, []);

  return <>{children}</>;
}
