import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Free",
    price: "€0",
    period: "forever",
    desc: "Get started with essential coaching tools.",
    features: [
      { text: "Community feed access", included: true },
      { text: "Basic tactic board", included: true },
      { text: "Free exercises only", included: true },
      { text: "2-week planner", included: true },
      { text: "1 exercise submission/year", included: true },
      { text: "Premium exercises", included: false },
      { text: "Animated tactic board", included: false },
      { text: "Verified badge", included: false },
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Premium Coach",
    price: "€7.99",
    period: "/month",
    desc: "Unlock the full coaching toolkit.",
    features: [
      { text: "Everything in Free", included: true },
      { text: "Premium exercises access", included: true },
      { text: "Full season planner", included: true },
      { text: "Animated tactic board + 5 saves", included: true },
      { text: "Unlimited exercise submissions", included: true },
      { text: "Verified profile badge", included: true },
      { text: "National calendar access", included: true },
      { text: "Match Maker", included: true },
    ],
    cta: "Go Premium",
    popular: true,
  },
  {
    name: "Pro Service",
    price: "€12.99",
    period: "/month",
    desc: "For coaches offering professional services.",
    features: [
      { text: "Everything in Premium", included: true },
      { text: "Marketplace listing", included: true },
      { text: "Profile analytics", included: true },
      { text: "Featured profile", included: true },
      { text: "Priority support", included: true },
      { text: "Club multi-user", included: false },
      { text: "Post vacancies", included: false },
      { text: "Internal club tools", included: false },
    ],
    cta: "Go Pro",
    popular: false,
  },
  {
    name: "Club License",
    price: "€59.99",
    period: "/year",
    desc: "Full platform access for your entire club.",
    features: [
      { text: "Everything in Premium", included: true },
      { text: "Up to 10 sub-accounts", included: true },
      { text: "Internal club tools", included: true },
      { text: "Post job vacancies", included: true },
      { text: "Webshop link on profile", included: true },
      { text: "Profile analytics", included: true },
      { text: "Priority support", included: true },
      { text: "Custom branding", included: true },
    ],
    cta: "Get Club License",
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          className="max-w-3xl mx-auto text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm mb-6">
            Pricing
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-6 text-foreground">
            Plans That Fit Your <span className="gradient-text">Ambition</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Start free, upgrade when ready. Every plan is crafted for real football professionals.
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
                  Most Popular
                </div>
              )}
              <h3 className="font-display font-semibold text-foreground text-lg">{plan.name}</h3>
              <div className="mt-3 mb-1">
                <span className="font-display text-3xl font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">{plan.desc}</p>

              <div className="space-y-3 flex-1 mb-6">
                {plan.features.map((f) => (
                  <div key={f.text} className="flex items-center gap-2 text-sm">
                    {f.included ? (
                      <Check size={16} className="text-primary shrink-0" />
                    ) : (
                      <X size={16} className="text-muted-foreground/40 shrink-0" />
                    )}
                    <span className={f.included ? "text-foreground" : "text-muted-foreground/40"}>
                      {f.text}
                    </span>
                  </div>
                ))}
              </div>

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
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
