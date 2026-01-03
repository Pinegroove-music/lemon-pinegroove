
import { useStore } from '../store/useStore';

export const useSubscription = () => {
  const { session, isSubscriber, subscriptionStatus } = useStore();

  const isPro = isSubscriber === true;
  const userId = session?.user?.id;
  
  // URL dell'abbonamento con ID utente dinamico (UUID Lemon Squeezy)
  const subscriptionVariantId = '8deed6fa-4743-4612-bfc3-d819a742331f';
  const checkoutUrl = userId 
    ? `https://pinegroove.lemonsqueezy.com/checkout/buy/${subscriptionVariantId}?checkout[custom][user_id]=${userId}`
    : `https://pinegroove.lemonsqueezy.com/checkout/buy/${subscriptionVariantId}`;

  const openSubscriptionCheckout = () => {
    if (!userId) return; // Gestire re-indirizzamento auth esternamente se necessario
    
    console.log("DEBUG SUBSCRIPTION URL:", checkoutUrl);
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
