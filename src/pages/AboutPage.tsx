import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Target, Users, Award, Globe } from "lucide-react";

export default function AboutPage() {
  const { t } = useTranslation();

  const values = [
    {
      icon: Target,
      title: t("about.values.excellence"),
      desc: t("about.values.excellenceDesc"),
    },
    {
      icon: Users,
      title: t("about.values.community"),
      desc: t("about.values.communityDesc"),
    },
    {
      icon: Award,
      title: t("about.values.innovation"),
      desc: t("about.values.innovationDesc"),
    },
    {
      icon: Globe,
      title: t("about.values.accessibility"),
      desc: t("about.values.accessibilityDesc"),
    },
  ];

  return (
    <div className="py-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          className="max-w-3xl mx-auto text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm mb-6">
            {t("about.badge")}
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-6 text-foreground">
            {t("about.title")}{" "}
            <span className="gradient-text">{t("about.titleHighlight")}</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            {t("about.description")}
          </p>
        </motion.div>

        {/* Story */}
        <motion.div
          className="glass-card p-8 md:p-12 mb-16 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
            {t("about.ourStory")}
          </h2>
          <div className="space-y-4 text-muted-foreground">
            <p>{t("about.storyP1")}</p>
            <p>{t("about.storyP2")}</p>
            <p>{t("about.storyP3")}</p>
          </div>
        </motion.div>

        {/* Values */}
        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {values.map((v, i) => (
            <motion.div
              key={v.title}
              className="glass-card-hover p-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <v.icon className="text-primary" size={20} />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">
                {v.title}
              </h3>
              <p className="text-sm text-muted-foreground">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
