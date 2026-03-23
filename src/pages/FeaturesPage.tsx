import { motion } from "framer-motion";
import { BookOpen, Target, Calendar, Users, MessageSquare, Trophy, BarChart3, ShoppingBag, Shield, Zap } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Exercise Library",
    desc: "Browse and share 1000+ drills organized by category (passing, shooting, tactical, etc.), age group, and difficulty. Premium members unlock advanced exercises.",
    tag: "Technical Hub",
  },
  {
    icon: Target,
    title: "Interactive Tactic Board",
    desc: "Design formations, draw movement arrows, and create animated tactical sequences. Save and share your boards with your team.",
    tag: "Technical Hub",
  },
  {
    icon: Calendar,
    title: "Season Planner",
    desc: "Plan weeks, months, or entire seasons. Drag-and-drop exercises into training sessions with built-in periodization support.",
    tag: "Technical Hub",
  },
  {
    icon: Users,
    title: "Professional Network",
    desc: "Build your coaching profile, connect with peers, follow clubs, and grow your professional reputation in Portuguese football.",
    tag: "Network",
  },
  {
    icon: MessageSquare,
    title: "Real-Time Messaging",
    desc: "Instant messaging with coaches, clubs, and scouts. Share exercises, tactics, and opportunities directly.",
    tag: "Network",
  },
  {
    icon: Trophy,
    title: "Job Board & Vacancies",
    desc: "Clubs post coaching vacancies, scouts discover talent — find your next opportunity or the perfect candidate.",
    tag: "Network",
  },
  {
    icon: ShoppingBag,
    title: "Marketplace",
    desc: "Offer private training, video analysis, consulting, and scouting services. Built-in payments via Stripe.",
    tag: "Marketplace",
  },
  {
    icon: BarChart3,
    title: "Profile Analytics",
    desc: "Track profile views, engagement metrics, and see who's looking at your coaching portfolio.",
    tag: "Pro Feature",
  },
  {
    icon: Shield,
    title: "Verified Profiles",
    desc: "Premium coaches get a verified badge, boosting credibility and visibility in search results.",
    tag: "Premium",
  },
  {
    icon: Zap,
    title: "Match Maker",
    desc: "Request and organize friendly matches between teams. Auto-publishes to the national match calendar.",
    tag: "Network",
  },
];

const tagColors: Record<string, string> = {
  "Technical Hub": "bg-primary/10 text-primary",
  "Network": "bg-blue-500/10 text-blue-400",
  "Marketplace": "bg-amber-500/10 text-amber-400",
  "Pro Feature": "bg-purple-500/10 text-purple-400",
  "Premium": "bg-primary/10 text-primary",
};

export default function FeaturesPage() {
  return (
    <div className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          className="max-w-3xl mx-auto text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm mb-6">
            Features
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-6 text-foreground">
            Tools Built for{" "}
            <span className="gradient-text">Real Coaches</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Every feature is designed around the daily workflow of football professionals — from session planning to career development.
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
                <span className={`text-xs px-2 py-1 rounded-full ${tagColors[feat.tag] || "bg-muted text-muted-foreground"}`}>
                  {feat.tag}
                </span>
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">{feat.title}</h3>
              <p className="text-sm text-muted-foreground flex-1">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
