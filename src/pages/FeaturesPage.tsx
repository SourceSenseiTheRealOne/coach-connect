import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  BookOpen,
  Target,
  Calendar,
  Users,
  MessageSquare,
  Trophy,
  BarChart3,
  ShoppingBag,
  Shield,
  Zap,
} from "lucide-react";

export default function FeaturesPage() {
  const { t } = useTranslation();

  const features = [
    {
      icon: BookOpen,
      title: t("features.list.exerciseLibrary"),
      desc: t("features.list.exerciseLibraryDesc"),
      tag: t("features.tags.technicalHub"),
    },
    {
      icon: Target,
      title: t("features.list.tacticBoard"),
      desc: t("features.list.tacticBoardDesc"),
      tag: t("features.tags.technicalHub"),
    },
    {
      icon: Calendar,
      title: t("features.list.seasonPlanner"),
      desc: t("features.list.seasonPlannerDesc"),
      tag: t("features.tags.technicalHub"),
    },
    {
      icon: Users,
      title: t("features.list.network"),
      desc: t("features.list.networkDesc"),
      tag: t("features.tags.network"),
    },
    {
      icon: MessageSquare,
      title: t("features.list.messaging"),
      desc: t("features.list.messagingDesc"),
      tag: t("features.tags.network"),
    },
    {
      icon: Trophy,
      title: t("features.list.jobBoard"),
      desc: t("features.list.jobBoardDesc"),
      tag: t("features.tags.network"),
    },
    {
      icon: ShoppingBag,
      title: t("features.list.marketplace"),
      desc: t("features.list.marketplaceDesc"),
      tag: t("features.tags.marketplace"),
    },
    {
      icon: BarChart3,
      title: t("features.list.analytics"),
      desc: t("features.list.analyticsDesc"),
      tag: t("features.tags.proFeature"),
    },
    {
      icon: Shield,
      title: t("features.list.verified"),
      desc: t("features.list.verifiedDesc"),
      tag: t("features.tags.premium"),
    },
    {
      icon: Zap,
      title: t("features.list.matchMaker"),
      desc: t("features.list.matchMakerDesc"),
      tag: t("features.tags.network"),
    },
  ];

  const tagColors: Record<string, string> = {
    [t("features.tags.technicalHub")]: "bg-primary/10 text-primary",
    [t("features.tags.network")]: "bg-blue-500/10 text-blue-400",
    [t("features.tags.marketplace")]: "bg-amber-500/10 text-amber-400",
    [t("features.tags.proFeature")]: "bg-purple-500/10 text-purple-400",
    [t("features.tags.premium")]: "bg-primary/10 text-primary",
  };

  return (
    <div className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          className="max-w-3xl mx-auto text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm mb-6">
            {t("features.badge")}
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-6 text-foreground">
            {t("features.title")}{" "}
            <span className="gradient-text">
              {t("features.titleHighlight")}
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            {t("features.description")}
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              className="glass-card-hover p-6 flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <feat.icon className="text-primary" size={20} />
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${tagColors[feat.tag] || "bg-muted text-muted-foreground"}`}
                >
                  {feat.tag}
                </span>
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">
                {feat.title}
              </h3>
              <p className="text-sm text-muted-foreground flex-1">
                {feat.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
