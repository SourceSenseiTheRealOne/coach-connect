import { motion } from "framer-motion";
import { MapPin, Award, Users, BookOpen, Calendar, Edit, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const profileStats = [
  { label: "Exercises", value: "47" },
  { label: "Followers", value: "1,234" },
  { label: "Following", value: "567" },
  { label: "Views", value: "8.2k" },
];

const recentExercises = [
  { title: "Diamond Passing Drill", category: "Passing", age: "U14", likes: 234 },
  { title: "High Press Trigger Training", category: "Tactical", age: "U17", likes: 156 },
  { title: "Positional Rondo 6v2", category: "Rondo", age: "Senior", likes: 312 },
];

export default function ProfilePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Cover + Avatar */}
      <motion.div
        className="glass-card overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="h-40 sm:h-52 bg-gradient-to-br from-primary/20 via-accent/10 to-background relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(160_84%_39%/0.15),transparent)]" />
        </div>
        <div className="px-6 pb-6 -mt-12 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="w-24 h-24 rounded-2xl bg-card border-4 border-background flex items-center justify-center">
              <span className="font-display text-2xl font-bold text-primary">JM</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-bold text-foreground">José Mourinho</h1>
                <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] text-primary-foreground font-bold">✓</span>
              </div>
              <p className="text-sm text-muted-foreground">Head Coach · UEFA PRO License</p>
            </div>
            <Button size="sm" variant="outline" className="border-border text-foreground hover:bg-secondary gap-1 self-start">
              <Edit size={14} /> Edit Profile
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-4 gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {profileStats.map((stat) => (
          <div key={stat.label} className="glass-card p-4 text-center">
            <div className="font-display text-lg font-bold text-foreground">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Info */}
        <motion.div
          className="glass-card p-5 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="font-display font-semibold text-foreground">About</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Experienced football coach with 15+ years in Portuguese football. Specialized in youth development and tactical innovation. Passionate about developing the next generation of Portuguese football talent.
          </p>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin size={14} className="text-primary" /> Lisboa, Portugal
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Award size={14} className="text-primary" /> UEFA PRO License
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users size={14} className="text-primary" /> Coach (Senior & Youth)
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar size={14} className="text-primary" /> Joined March 2026
            </div>
          </div>
        </motion.div>

        {/* Recent Exercises */}
        <motion.div
          className="glass-card p-5 md:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-foreground">Recent Exercises</h2>
            <button className="text-sm text-primary hover:underline flex items-center gap-1">
              View All <ExternalLink size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {recentExercises.map((ex) => (
              <div
                key={ex.title}
                className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-foreground truncate">{ex.title}</h3>
                  <p className="text-xs text-muted-foreground">{ex.category} · {ex.age}</p>
                </div>
                <span className="text-xs text-muted-foreground">❤ {ex.likes}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
