import { Link } from "react-router-dom";
import { lazy, Suspense } from "react";
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

const HeroScene = lazy(() =>
  import("@/components/three/HeroScene").then((m) => ({ default: m.HeroScene })),
);

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
      <section className="relative min-h-[95vh] flex items-center overflow-hidden geometric-pattern">
        <div className="absolute inset-0">
          <img
            src={heroBg}
            alt=""
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background" />
          <div className="absolute inset-0 noise-overlay" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8 animate-gradient">
                  <span className="glow-dot" />
                  {t("landing.badge")}
                </span>
              </motion.div>

              <motion.h1
                className="font-display text-5xl sm:text-6xl lg:text-8xl font-bold leading-[1.1] mb-8 tracking-tight"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
              >
                {t("landing.title")}{" "}
                <span className="gradient-text">
                  {t("landing.titleHighlight")}
                </span>{" "}
                {t("landing.titleEnd")}
              </motion.h1>

              <motion.p
                className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-xl leading-relaxed"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {t("landing.description")}
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              >
                <Link to="/signup">
                  <Button
                    size="lg"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-base px-10 shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/35"
                  >
                    {t("landing.startFree")} <ArrowRight size={18} />
                  </Button>
                </Link>
                <Link to="/features">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-border text-foreground hover:bg-muted/70 hover:border-border text-base px-10 transition-all duration-300"
                  >
                    {t("landing.exploreFeatures")}
                  </Button>
                </Link>
              </motion.div>
            </div>

            <motion.div
              className="relative hidden lg:block h-[560px]"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
            >
              {/* Soft glow halos behind the 3D scene */}
              <div className="absolute top-10 right-10 w-72 h-72 bg-primary/25 rounded-full blur-[120px] pointer-events-none" />
              <div className="absolute bottom-10 left-10 w-80 h-80 bg-teal-500/15 rounded-full blur-[140px] pointer-events-none" />

              {/* Floating stat badges */}
              <motion.div
                className="absolute top-4 left-0 z-20 glass-card px-4 py-3 flex items-center gap-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
              >
                <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
                  <BookOpen className="text-primary" size={18} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Drills</div>
                  <div className="font-display font-bold text-foreground text-sm">
                    12,000+
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute bottom-12 right-0 z-20 glass-card px-4 py-3 flex items-center gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 }}
              >
                <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Users className="text-primary" size={18} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Coaches</div>
                  <div className="font-display font-bold text-foreground text-sm">
                    5,000+
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute top-1/2 -translate-y-1/2 right-2 z-20 glass-card px-3 py-2 flex items-center gap-2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.6 }}
              >
                <span className="glow-dot" />
                <span className="mono text-[10px] uppercase tracking-wider text-foreground">
                  Live · {new Date().getFullYear()}
                </span>
              </motion.div>

              {/* 3D football scene */}
              <div className="absolute inset-0">
                <Suspense fallback={null}>
                  <HeroScene />
                </Suspense>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 border-y border-border bg-card/30 geometric-pattern">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: i * 0.1, duration: 0.6, ease: "easeOut" }}
              >
                <div className="font-display text-4xl sm:text-5xl font-bold gradient-text mb-2 group-hover:scale-110 transition-transform duration-300">
                  {stat.value}
                </div>
                <div className="text-muted-foreground text-sm font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-6 tracking-tight">
              {t("landing.features.title")}{" "}
              <span className="gradient-text">
                {t("landing.features.titleHighlight")}
              </span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              {t("landing.features.description")}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                className="glass-card-hover p-8 group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.6, ease: "easeOut" }}
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feat.icon className="text-primary" size={28} />
                </div>
                <h3 className="font-display font-semibold text-xl mb-3 text-foreground">
                  {feat.title}
                </h3>
                <p className="text-muted-foreground text-base leading-relaxed">
                  {feat.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div
            className="glass-card p-16 text-center relative overflow-hidden max-w-4xl mx-auto"
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-muted/70" />
            <div className="absolute inset-0 noise-overlay" />
            <div className="relative z-10">
              <h2 className="font-display text-4xl sm:text-5xl font-bold mb-6 text-foreground tracking-tight">
                {t("landing.cta.title")}
              </h2>
              <p className="text-muted-foreground mb-10 max-w-2xl mx-auto text-lg">
                {t("landing.cta.description")}
              </p>
              <Link to="/signup">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-base px-12 py-6 shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/35 hover:scale-105"
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
