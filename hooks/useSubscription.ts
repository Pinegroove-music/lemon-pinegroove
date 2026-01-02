
import { useStore } from '../store/useStore';

export const useSubscription = () => {
  const { session, isSubscriber, subscriptionStatus } = useStore();

  const isPro = isSubscriber === true;
  const userId = session?.user?.id;
  
  // URL dell'abbonamento con ID utente dinamico
  const subscriptionVariantId = '1e09fa35-b369-4e18-83ea-3863e60313a7';
  const checkoutUrl = userId 
    ? `https://pinegroove.lemonsqueezy.com/checkout/buy/${subscriptionVariantId}?checkout[custom][user_id]=${userId}`
    : `https://pinegroove.lemonsqueezy.com/checkout/buy/${subscriptionVariantId}`;

  const openSubscriptionCheckout = () => {
    if (!userId) return; // Gestire re-indirizzamento auth esternamente se necessario
    
    if (window.LemonSqueezy) {
      window.LemonSqueezy.Url.Open(checkoutUrl);
    } else {
      window.open(checkoutUrl, '_blank');
    }
  };

  return {
    isPro,
    subscriptionStatus,
    checkoutUrl,
    openSubscriptionCheckout
  };
};
