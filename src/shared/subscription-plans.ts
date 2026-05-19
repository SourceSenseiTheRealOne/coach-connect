import type { SubscriptionTier } from "./types";

export const PRICE_IDS = {
  PRO_SERVICE: "price_1TRZLgHWoHwKWIEOGA0VcMdu",
  CLUB_LICENSE: "price_1TRZLhHWoHwKWIEOx71Pf3Wk",
} as const;

export const SUPPORTED_PAID_PRICE_IDS = Object.values(PRICE_IDS);

export type StripePriceId = (typeof SUPPORTED_PAID_PRICE_IDS)[number];
export type PaidSubscriptionTier = Extract<
  SubscriptionTier,
  "pro_service" | "club_license"
>;

export const TIER_BY_PRICE_ID: Record<StripePriceId, PaidSubscriptionTier> = {
  [PRICE_IDS.PRO_SERVICE]: "pro_service",
  [PRICE_IDS.CLUB_LICENSE]: "club_license",
};

export function isSupportedPaidPriceId(
  priceId: string,
): priceId is StripePriceId {
  return (SUPPORTED_PAID_PRICE_IDS as readonly string[]).includes(priceId);
}

export function getTierForPriceId(
  priceId: string,
): PaidSubscriptionTier | undefined {
  return isSupportedPaidPriceId(priceId) ? TIER_BY_PRICE_ID[priceId] : undefined;
}
