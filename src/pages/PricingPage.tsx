import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Check, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { PRICE_IDS } from "@/shared/subscription-plans";

type PricingPlan = {
  name: string;
  price: string;
  period: string;
  desc: string;
  features: string[];
  cta: string;
  popular: boolean;
  priceId: string | null;
};

export default function PricingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutate: createCheckout, isPending } =
    trpc.subscription.createCheckoutSession.useMutation();

  const handleSubscribe = (priceId: string) => {
    createCheckout(
      { priceId },
      {
        onSuccess: (data) => {
          if (data.url) {
            window.location.href = data.url;
          }
        },
        onError: (error) => {
          console.error("Checkout error:", error);
          if (error.message?.includes("UNAUTHORIZED")) {
            navigate("/login");
          }
        },
      },
    );
  };

  const plans: PricingPlan[] = [
    {
      name: t("pricing.plans.free"),
      price: "€0",
      period: t("pricing.period.forever"),
      desc: t("pricing.features.free.desc"),
      features: [
        t("pricing.features.free.communityFeed"),
        t("pricing.features.free.basicTactic"),
        t("pricing.features.free.freeExercises"),
      ],
      cta: t("pricing.cta.startFree"),
      popular: false,
      priceId: null,
    },
    {
      name: t("pricing.plans.pro"),
      price: "€9.99",
      period: t("pricing.period.month"),
      desc: t("pricing.features.pro.desc"),
      features: [
        t("pricing.features.premium.everythingFree"),
        t("pricing.features.premium.premiumExercises"),
        t("pricing.features.pro.marketplaceListing"),
        t("pricing.features.pro.profileTier", {
          defaultValue: "Pro Service profile tier",
        }),
      ],
      cta: t("pricing.cta.goPro"),
      popular: true,
      priceId: PRICE_IDS.PRO_SERVICE,
    },
    {
      name: t("pricing.plans.club"),
      price: "€29.99",
      period: t("pricing.period.month"),
      desc: t("pricing.features.club.desc"),
      features: [
        t("pricing.features.club.everythingPro", {
          defaultValue: "Everything in Pro Service",
        }),
        t("pricing.features.club.postVacancies"),
        t("pricing.features.pro.marketplaceListing"),
        t("pricing.features.club.profileTier", {
          defaultValue: "Club License profile tier",
        }),
      ],
      cta: t("pricing.cta.getLicense"),
      popular: false,
      priceId: PRICE_IDS.CLUB_LICENSE,
    },
  ];

  return (
    <div className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          className="max-w-3xl mx-auto text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm mb-6">
            {t("pricing.badge")}
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-6 text-foreground">
            {t("pricing.title")}{" "}
            <span className="gradient-text">{t("pricing.titleHighlight")}</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            {t("pricing.description")}
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              className={`glass-card p-6 flex flex-col relative ${
                plan.popular ? "border-primary/50 ring-1 ring-primary/20" : ""
              }`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                  {t("pricing.mostPopular")}
                </div>
              )}
              <h3 className="font-display font-semibold text-foreground text-lg">
                {plan.name}
              </h3>
              <div className="mt-3 mb-1">
                <span className="font-display text-3xl font-bold text-foreground">
                  {plan.price}
                </span>
                <span className="text-muted-foreground text-sm">
                  {plan.period}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">{plan.desc}</p>

              <div className="space-y-3 flex-1 mb-6">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm">
                    <Check size={16} className="text-primary shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              {plan.priceId ? (
                <Button
                  onClick={() => {
                    if (plan.priceId) handleSubscribe(plan.priceId);
                  }}
                  disabled={isPending}
                  className={`w-full ${
                    plan.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border border-border bg-background text-foreground hover:bg-muted/70"
                  }`}
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  {plan.cta}
                </Button>
              ) : (
                <Link to="/signup">
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "border border-border bg-background text-foreground hover:bg-muted/70"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
