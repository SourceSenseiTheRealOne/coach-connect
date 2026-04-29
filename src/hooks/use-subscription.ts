import { trpc } from "@/lib/trpc";

// ============================================================
// QUERY KEYS
// ============================================================

export const subscriptionKeys = {
    all: ["subscription"] as const,
    plans: () => [...subscriptionKeys.all, "plans"] as const,
    mySubscription: () => [...subscriptionKeys.all, "my"] as const,
    publishableKey: () => [...subscriptionKeys.all, "publishableKey"] as const,
};

// ============================================================
// HOOKS
// ============================================================

/**
 * Hook to fetch available subscription plans
 */
export function useSubscriptionPlans() {
    return trpc.subscription.getPlans.useQuery(undefined, {
        staleTime: 60 * 1000, // Plans change rarely
    });
}

/**
 * Hook to fetch current user's subscription
 */
export function useMySubscription() {
    return trpc.subscription.getUserSubscription.useQuery(undefined, {
        staleTime: 30 * 1000,
    });
}

/**
 * Hook to create a Stripe checkout session
 */
export function useCreateCheckoutSession() {
    return trpc.subscription.createCheckoutSession.useMutation();
}

/**
 * Hook to cancel current subscription
 */
export function useCancelSubscription() {
    const utils = trpc.useUtils();

    return trpc.subscription.cancelSubscription.useMutation({
        onSuccess: () => {
            utils.subscription.getUserSubscription.invalidate();
        },
    });
}

/**
 * Hook to get Stripe publishable key
 */
export function useStripePublishableKey() {
    return trpc.subscription.getPublishableKey.useQuery(undefined, {
        staleTime: Infinity, // Never expires
    });
}
