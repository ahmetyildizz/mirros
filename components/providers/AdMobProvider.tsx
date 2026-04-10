"use client";

import { useEffect, ReactNode } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { AdMobService } from "@/lib/services/admob.service";

interface Props {
  children: ReactNode;
}

export function AdMobProvider({ children }: Props) {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // 1. Initialize AdMob
    AdMobService.initialize().then(() => {
      // 2. Initial App Open Ad on launch
      AdMobService.showAppOpenAd();
      
      // 3. Pre-load Interstitial (for later use)
      AdMobService.prepareInterstitial();
    });

    // 4. Handle App State Changes (Background to Foreground)
    const listener = App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) {
        // App returned to foreground -> Show App Open Ad
        AdMobService.showAppOpenAd();
        // Also refresh Interstitial cache
        AdMobService.prepareInterstitial();
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, []);

  return <>{children}</>;
}
