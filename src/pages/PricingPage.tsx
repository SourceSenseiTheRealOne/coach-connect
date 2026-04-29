import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Check, X, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

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
          // Redirect to login if not authenticated
          if (error.message?.includes("UNAUTHORIZED")) {
            navigate("/login");
          }
        },
      },
    );
  };

  const plans = [
    {
      name: t("pricing.plans.free"),
      price: "€0",
      period: t("pricing.period.forever"),
      desc: t("pricing.features.free.desc"),
      features: [
        { text: t("pricing.features.free.communityFeed"), included: true },
        { text: t("pricing.features.free.basicTactic"), included: true },
        { text: t("pricing.features.free.freeExercises"), included: true },
        { text: t("pricing.features.free.twoWeekPlanner"), included: true },
        { text: t("pricing.features.free.oneSubmission"), included: true },
        {
          text: t("pricing.features.premium.premiumExercises"),
          included: false,
        },
        { text: t("pricing.features.premium.animatedBoard"), included: false },
        { text: t("pricing.features.premium.verifiedBadge"), included: false },
      ],
      cta: t("pricing.cta.startFree"),
      popular: false,
      priceId: null,
    },
    {
      name: "Pro Service",
      price: "€9.99",
      period: t("pricing.period.month"),
      desc: t("pricing.features.premium.desc"),
      features: [
        { text: t("pricing.features.premium.everythingFree"), included: true },
        {
          text: t("pricing.features.premium.premiumExercises"),
          included: true,
        },
        { text: t("pricing.features.premium.fullPlanner"), included: true },
        { text: t("pricing.features.premium.animatedBoard"), included: true },
        {
          text: t("pricing.features.premium.unlimitedSubmissions"),
          included: true,
        },
        { text: t("pricing.features.premium.verifiedBadge"), included: true },
        { text: t("pricing.features.premium.calendarAccess"), included: true },
        { text: t("pricing.features.premium.matchMaker"), included: true },
      ],
      cta: t("pricing.cta.goPremium"),
      popular: true,
      priceId: "price_1TRZLgHWoHwKWIEOGA0VcMdu",
    },
    {
      name: t("pricing.plans.pro"),
      price: "€12.99",
      period: t("pricing.period.month"),
      desc: t("pricing.features.pro.desc"),
      features: [
        { text: t("pricing.features.pro.everythingPremium"), included: true },
        { text: t("pricing.features.pro.marketplaceListing"), included: true },
        { text: t("pricing.features.pro.profileAnalytics"), included: true },
        { text: t("pricing.features.pro.featuredProfile"), included: true },
        { text: t("pricing.features.pro.prioritySupport"), included: true },
        { text: t("pricing.features.club.subAccounts"), included: false },
        { text: t("pricing.features.club.postVacancies"), included: false },
        { text: t("pricing.features.club.clubTools"), included: false },
      ],
      cta: t("pricing.cta.goPro"),
      popular: false,
      priceId: null,
    },
    {
      name: "Club License",
      price: "€29.99",
      period: t("pricing.period.month"),
      desc: t("pricing.features.club.desc"),
      features: [
        { text: t("pricing.features.club.everythingPremium"), included: true },
        { text: t("pricing.features.club.subAccounts"), included: true },
        { text: t("pricing.features.club.clubTools"), included: true },
        { text: t("pricing.features.club.postVacancies"), included: true },
        { text: t("pricing.features.club.webshopLink"), included: true },
        { text: t("pricing.features.pro.profileAnalytics"), included: true },
        { text: t("pricing.features.pro.prioritySupport"), included: true },
        { text: "Custom branding", included: true },
      ],
      cta: t("pricing.cta.getLicense"),
      popular: false,
      priceId: "price_1TRZLhHWoHwKWIEOx71Pf3Wk",
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

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
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
                {plan.features.map((f) => (
                  <div key={f.text} className="flex items-center gap-2 text-sm">
                    {f.included ? (
                      <Check size={16} className="text-primary shrink-0" />
                    ) : (
                      <X
                        size={16}
                        className="text-muted-foreground/40 shrink-0"
                      />
                    )}
                    <span
                      className={
                        f.included
                          ? "text-foreground"
                          : "text-muted-foreground/40"
                      }
                    >
                      {f.text}
                    </span>
                  </div>
                ))}
              </div>

              {plan.priceId ? (
                <Button
                  onClick={() => handleSubscribe(plan.priceId!)}
                  disabled={isPending}
                  className={`w-full ${
                    plan.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
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
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
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
