import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import api from '../services/api';

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

export interface PurchaseResult {
  success: boolean;
  message: string;
  verified: boolean;
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

  /**
   * Verify purchase with backend server
   * This is critical for security - never trust client-side purchase verification alone
   */
  const verifyPurchaseWithBackend = async (
    productId: string,
    receiptData: string,
    transactionId?: string
  ): Promise<PurchaseResult> => {
    try {
      const response = await api.post('/api/iap/verify-purchase', {
        platform: Platform.OS,
        product_id: productId,
        receipt_data: receiptData,
        transaction_id: transactionId,
      });

      return {
        success: response.data.success,
        message: response.data.message,
        verified: response.data.verified,
      };
    } catch (err: any) {
      console.error('Backend verification error:', err);
      return {
        success: false,
        message: err.response?.data?.detail || 'Verification failed',
        verified: false,
      };
    }
  };

  const purchaseProduct = useCallback(async (productId: string): Promise<PurchaseResult> => {
    if (isWebPreview || !connected) {
      setError('In-App Purchases are only available in the native app. Please download from App Store or Google Play.');
      return { success: false, message: 'Not available on web', verified: false };
    }

    setPurchasing(productId);
    setError(null);

    try {
      // Dynamic import for native builds
      const expoIap = await import('expo-iap');
      
      let purchase: any;
      if (Platform.OS === 'ios') {
        purchase = await expoIap.requestPurchase({ sku: productId });
      } else {
        purchase = await expoIap.requestPurchase({ skus: [productId] });
      }

      // Get the receipt/token for verification
      const receiptData = Platform.OS === 'ios' 
        ? purchase.transactionReceipt 
        : purchase.purchaseToken;
      
      const transactionId = Platform.OS === 'ios'
        ? purchase.transactionId
        : purchase.orderId;

      // CRITICAL: Verify with backend before granting access
      const verification = await verifyPurchaseWithBackend(
        productId,
        receiptData,
        transactionId
      );

      if (verification.success && verification.verified) {
        // Acknowledge/finish the purchase
        if (Platform.OS === 'ios') {
          await expoIap.finishTransaction({ purchase, isConsumable: productId === PRODUCT_IDS.ROSES || productId === PRODUCT_IDS.SKIP_CHAT });
        } else {
          await expoIap.acknowledgePurchaseAndroid({ purchaseToken: receiptData });
        }
        
        setPurchasing(null);
        return verification;
      } else {
        // Verification failed - don't grant access
        setError(verification.message || 'Purchase verification failed');
        setPurchasing(null);
        return verification;
      }
    } catch (err: any) {
      console.error('Purchase error:', err);
      setError(err.message || 'Purchase failed');
      setPurchasing(null);
      return { success: false, message: err.message || 'Purchase failed', verified: false };
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
      
      // Verify each purchase with backend and restore
      const restoredPurchases: PurchaseResult[] = [];
      
      for (const purchase of purchases) {
        const receiptData = Platform.OS === 'ios' 
          ? purchase.transactionReceipt 
          : purchase.purchaseToken;
        
        const verification = await verifyPurchaseWithBackend(
          purchase.productId,
          receiptData,
          purchase.transactionId
        );
        
        if (verification.success) {
          restoredPurchases.push(verification);
        }
      }
      
      // Also call backend restore endpoint to get current status
      try {
        const restoreResponse = await api.post('/api/iap/restore-purchases');
        console.log('Restore status:', restoreResponse.data);
      } catch (err) {
        console.log('Backend restore check failed:', err);
      }
      
      return restoredPurchases;
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
    verifyPurchaseWithBackend,
    clearError: () => setError(null),
  };
}
