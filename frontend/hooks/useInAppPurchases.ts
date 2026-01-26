import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Product IDs - Must match App Store Connect and Google Play Console
export const PRODUCT_IDS = {
  PREMIUM_MONTHLY: 'uk.wahala.premium.monthly',
  PREMIUM_YEARLY: 'uk.wahala.premium.yearly',
  ROSES: 'uk.wahala.roses',
  SKIP_CHAT: 'uk.wahala.skip_chat_wait',
};

export interface Product {
  productId: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  type: 'subscription' | 'consumable';
}

// Check if we're running in a native environment
const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

export function useInAppPurchases() {
  const [isReady, setIsReady] = useState(false);
  const [connected, setConnected] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [subscriptions, setSubscriptions] = useState<Product[]>([]);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isWebPreview, setIsWebPreview] = useState(false);

  useEffect(() => {
    const init = async () => {
      // If running on web, show web preview message
      if (Platform.OS === 'web') {
        setIsWebPreview(true);
        setIsReady(true);
        setConnected(false);
        return;
      }

      // Try to load IAP module dynamically (only works in native builds)
      try {
        const { useIAP } = await import('expo-iap');
        // If we get here in a native build, IAP is available
        setIsReady(true);
        setConnected(true);
      } catch (err) {
        console.log('IAP not available - running in Expo Go or web');
        setIsWebPreview(true);
        setIsReady(true);
        setConnected(false);
      }
    };

    init();
  }, []);

  const purchaseProduct = useCallback(async (productId: string) => {
    if (isWebPreview || !connected) {
      setError('In-App Purchases are only available in the native app. Please download from App Store or Google Play.');
      return false;
    }

    setPurchasing(productId);
    setError(null);

    try {
      // Dynamic import for native builds
      const expoIap = await import('expo-iap');
      if (Platform.OS === 'ios') {
        await expoIap.requestPurchase({ sku: productId });
      } else {
        await expoIap.requestPurchase({ skus: [productId] });
      }
      setPurchasing(null);
      return true;
    } catch (err: any) {
      console.error('Purchase error:', err);
      setError(err.message || 'Purchase failed');
      setPurchasing(null);
      return false;
    }
  }, [connected, isWebPreview]);

  const restorePurchases = useCallback(async () => {
    if (isWebPreview || !connected) {
      setError('Restore is only available in the native app.');
      return [];
    }

    try {
      const expoIap = await import('expo-iap');
      const purchases = await expoIap.getAvailablePurchases();
      return purchases;
    } catch (err: any) {
      console.error('Restore error:', err);
      setError(err.message);
      return [];
    }
  }, [connected, isWebPreview]);

  return {
    isReady,
    connected,
    products,
    subscriptions,
    purchasing,
    error,
    isWebPreview,
    purchaseProduct,
    restorePurchases,
    clearError: () => setError(null),
  };
}
