import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Users,
  BookOpen,
  MessageSquare,
  Trophy,
  Target,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WelcomeModal } from "@/components/WelcomeModal";
import heroBg from "@/assets/hero-bg.jpg";

export default function LandingPage() {
  const { t } = useTranslation();

  const features = [
    {
      icon: BookOpen,
      title: t("landing.features.drillLibrary"),
      desc: t("landing.features.drillLibraryDesc"),
    },
    {
      icon: Target,
      title: t("landing.features.tacticBoard"),
      desc: t("landing.features.tacticBoardDesc"),
    },
    {
      icon: Calendar,
      title: t("landing.features.seasonPlanner"),
      desc: t("landing.features.seasonPlannerDesc"),
    },
    {
      icon: Users,
      title: t("landing.features.network"),
      desc: t("landing.features.networkDesc"),
    },
    {
      icon: MessageSquare,
      title: t("landing.features.messaging"),
      desc: t("landing.features.messagingDesc"),
    },
    {
      icon: Trophy,
      title: t("landing.features.jobBoard"),
      desc: t("landing.features.jobBoardDesc"),
    },
  ];

  const stats = [
    { value: "5,000+", label: t("landing.stats.coaches") },
    { value: "800+", label: t("landing.stats.clubs") },
    { value: "12,000+", label: t("landing.stats.exercises") },
    { value: "200+", label: t("landing.stats.scouts") },
  ];

  return (
    <div>
      <WelcomeModal />
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroBg}
            alt=""
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm mb-6">
                <span className="glow-dot" />
                {t("landing.badge")}
              </span>
            </motion.div>

            <motion.h1
              className="font-display text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              {t("landing.title")}{" "}
              <span className="gradient-text">
                {t("landing.titleHighlight")}
              </span>{" "}
              {t("landing.titleEnd")}
            </motion.h1>

            <motion.p
              className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {t("landing.description")}
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <Link to="/signup">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-base px-8"
                >
                  {t("landing.startFree")} <ArrowRight size={18} />
                </Button>
              </Link>
              <Link to="/features">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-border text-foreground hover:bg-secondary text-base px-8"
                >
                  {t("landing.exploreFeatures")}
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-border bg-card/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="font-display text-3xl sm:text-4xl font-bold gradient-text mb-1">
                  {stat.value}
                </div>
                <div className="text-muted-foreground text-sm">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              {t("landing.features.title")}{" "}
              <span className="gradient-text">
                {t("landing.features.titleHighlight")}
              </span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("landing.features.description")}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                className="glass-card-hover p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feat.icon className="text-primary" size={24} />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2 text-foreground">
                  {feat.title}
                </h3>
                <p className="text-muted-foreground text-sm">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            className="glass-card p-12 text-center relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
            <div className="relative z-10">
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4 text-foreground">
                {t("landing.cta.title")}
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                {t("landing.cta.description")}
              </p>
              <Link to="/signup">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-base px-8"
                >
                  {t("landing.cta.button")} <ArrowRight size={18} />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
