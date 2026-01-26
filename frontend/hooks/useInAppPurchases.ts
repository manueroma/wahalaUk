import { useIAP } from 'expo-iap';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Product IDs - Must match App Store Connect and Google Play Console
export const PRODUCT_IDS = {
  PREMIUM_MONTHLY: 'uk.wahala.premium.monthly',
  PREMIUM_YEARLY: 'uk.wahala.premium.yearly',
  ROSES: 'uk.wahala.roses',
  SKIP_CHAT: 'uk.wahala.skip_chat_wait',
};

const SUBSCRIPTION_SKUS = [
  PRODUCT_IDS.PREMIUM_MONTHLY,
  PRODUCT_IDS.PREMIUM_YEARLY,
];

const PRODUCT_SKUS = [
  PRODUCT_IDS.ROSES,
  PRODUCT_IDS.SKIP_CHAT,
];

export interface Product {
  productId: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  type: 'subscription' | 'consumable';
}

export function useInAppPurchases() {
  const [isReady, setIsReady] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [subscriptions, setSubscriptions] = useState<Product[]>([]);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    connected,
    products: iapProducts,
    subscriptions: iapSubscriptions,
    currentPurchase,
    currentPurchaseError,
    initConnection,
    endConnection,
    getProducts,
    getSubscriptions,
    requestPurchase,
    finishTransaction,
    getAvailablePurchases,
  } = useIAP();

  // Initialize IAP connection
  useEffect(() => {
    const init = async () => {
      try {
        await initConnection();
        setIsReady(true);
      } catch (err: any) {
        console.error('IAP init error:', err);
        setError(err.message);
      }
    };

    init();

    return () => {
      endConnection();
    };
  }, []);

  // Fetch products when connected
  useEffect(() => {
    const fetchProducts = async () => {
      if (!connected) return;

      try {
        // Fetch subscriptions
        await getSubscriptions({ skus: SUBSCRIPTION_SKUS });
        
        // Fetch consumable products
        await getProducts({ skus: PRODUCT_SKUS });
      } catch (err: any) {
        console.error('Failed to fetch products:', err);
        setError(err.message);
      }
    };

    fetchProducts();
  }, [connected]);

  // Update products state when IAP products change
  useEffect(() => {
    if (iapSubscriptions && iapSubscriptions.length > 0) {
      const subs: Product[] = iapSubscriptions.map((sub: any) => ({
        productId: sub.productId,
        title: sub.title || sub.name || 'Premium Subscription',
        description: sub.description || '',
        price: sub.localizedPrice || sub.price || '£9.99',
        currency: sub.currency || 'GBP',
        type: 'subscription' as const,
      }));
      setSubscriptions(subs);
    }

    if (iapProducts && iapProducts.length > 0) {
      const prods: Product[] = iapProducts.map((prod: any) => ({
        productId: prod.productId,
        title: prod.title || prod.name || 'Virtual Item',
        description: prod.description || '',
        price: prod.localizedPrice || prod.price || '£0.99',
        currency: prod.currency || 'GBP',
        type: 'consumable' as const,
      }));
      setProducts(prods);
    }
  }, [iapProducts, iapSubscriptions]);

  // Handle purchase completion
  useEffect(() => {
    const handlePurchase = async () => {
      if (currentPurchase) {
        try {
          // Finish the transaction
          await finishTransaction({
            purchase: currentPurchase,
            isConsumable: !SUBSCRIPTION_SKUS.includes(currentPurchase.productId),
          });
          
          setPurchasing(null);
        } catch (err: any) {
          console.error('Failed to finish transaction:', err);
          setError(err.message);
          setPurchasing(null);
        }
      }
    };

    handlePurchase();
  }, [currentPurchase]);

  // Handle purchase errors
  useEffect(() => {
    if (currentPurchaseError) {
      setError(currentPurchaseError.message);
      setPurchasing(null);
    }
  }, [currentPurchaseError]);

  const purchaseProduct = useCallback(async (productId: string) => {
    if (!connected || !isReady) {
      setError('Store not connected');
      return false;
    }

    setPurchasing(productId);
    setError(null);

    try {
      if (Platform.OS === 'ios') {
        await requestPurchase({ sku: productId });
      } else {
        await requestPurchase({ skus: [productId] });
      }
      return true;
    } catch (err: any) {
      console.error('Purchase error:', err);
      setError(err.message);
      setPurchasing(null);
      return false;
    }
  }, [connected, isReady, requestPurchase]);

  const restorePurchases = useCallback(async () => {
    try {
      const purchases = await getAvailablePurchases();
      return purchases;
    } catch (err: any) {
      console.error('Restore error:', err);
      setError(err.message);
      return [];
    }
  }, [getAvailablePurchases]);

  return {
    isReady,
    connected,
    products,
    subscriptions,
    purchasing,
    error,
    purchaseProduct,
    restorePurchases,
    clearError: () => setError(null),
  };
}
