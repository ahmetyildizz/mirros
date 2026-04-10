import { AdMob, BannerAdOptions, BannerAdPosition, BannerAdSize, AdMobBannerSize } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

const BANNER_ID        = 'ca-app-pub-3057274589981074/6875475702';
const INTERSTITIAL_ID  = 'ca-app-pub-3057274589981074/9519543233';
const APP_OPEN_ID      = 'ca-app-pub-3057274589981074/1975883108';
const REWARDED_ID      = 'ca-app-pub-3057274589981074/3962429375';

// COOLDOWN SETTINGS (ms)
const INTERSTITIAL_COOLDOWN = 180000; // 3 minutes
const APP_OPEN_COOLDOWN     = 300000; // 5 minutes

let lastInterstitialTime = 0;
let lastAppOpenTime     = 0;

export const AdMobService = {
  async initialize() {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await AdMob.initialize();
      console.log('AdMob Initialized');
    } catch (e) {
      console.error('AdMob Init Error:', e);
    }
  },

  // ─── BANNER ────────────────────────────────────────────────────────
  async showBanner() {
    if (!Capacitor.isNativePlatform()) return;

    const options: BannerAdOptions = {
      adId: BANNER_ID,
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
    };

    try {
      await AdMob.showBanner(options);
    } catch (e) {
      console.error('AdMob Show Banner Error:', e);
    }
  },

  async hideBanner() {
    if (!Capacitor.isNativePlatform()) return;
    try { await AdMob.hideBanner(); } catch (e) {}
  },

  // ─── INTERSTITIAL (GEÇİŞ) ──────────────────────────────────────────
  async prepareInterstitial() {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await AdMob.prepareInterstitial({ adId: INTERSTITIAL_ID });
    } catch (e) {
      console.error('AdMob Prepare Interstitial Error:', e);
    }
  },

  async showInterstitial() {
    if (!Capacitor.isNativePlatform()) return;

    // FREQUENCY CAPPING: Check cooldown
    const now = Date.now();
    if (now - lastInterstitialTime < INTERSTITIAL_COOLDOWN) {
      console.log('AdMob Interstitial: Cooldown active, skipping.');
      return;
    }

    try {
      await AdMob.showInterstitial();
      lastInterstitialTime = Date.now();
    } catch (e) {
      console.error('AdMob Show Interstitial Error:', e);
    }
  },

  // ─── APP OPEN (UYGULAMA AÇILIŞI) ──────────────────────────────────
  async showAppOpenAd() {
    if (!Capacitor.isNativePlatform()) return;

    // FREQUENCY CAPPING: Check cooldown
    const now = Date.now();
    if (now - lastAppOpenTime < APP_OPEN_COOLDOWN) {
      console.log('AdMob App Open: Cooldown active, skipping.');
      return;
    }

    try {
      await AdMob.showAppOpenAd({ adId: APP_OPEN_ID });
      lastAppOpenTime = Date.now();
    } catch (e) {
      console.error('AdMob App Open Error:', e);
    }
  },

  // ─── REWARDED (ÖDÜLLÜ) ──────────────────────────────────────────────
  async prepareRewardAd() {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await AdMob.prepareRewardVideoAd({ adId: REWARDED_ID });
    } catch (e) {
      console.error('AdMob Prepare Reward Error:', e);
    }
  },

  async showRewardAd() {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const reward = await AdMob.showRewardVideoAd();
      return reward;
    } catch (e) {
      console.error('AdMob Show Reward Error:', e);
      return null;
    }
  },

  // ─── LIFECYCLE ──────────────────────────────────────────────────────
  async removeBanner() {
    if (!Capacitor.isNativePlatform()) return;
    try { await AdMob.removeBanner(); } catch (e) {}
  }
};
