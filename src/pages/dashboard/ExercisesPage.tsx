import { motion } from "framer-motion";
import { Search, Filter, Star, Eye, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const categories = ["All", "Passing", "Shooting", "Dribbling", "Tactical", "Rondo", "Warmup", "Set Piece"];

const exercises = [
  { id: 1, title: "Diamond Passing Drill", category: "Passing", age: "U14", difficulty: "Intermediate", likes: 234, views: 1.2, premium: false, author: "Miguel S." },
  { id: 2, title: "1v1 Finishing Under Pressure", category: "Shooting", age: "U16", difficulty: "Advanced", likes: 189, views: 0.9, premium: true, author: "Ana R." },
  { id: 3, title: "Positional Rondo 6v2", category: "Rondo", age: "Senior", difficulty: "Intermediate", likes: 312, views: 2.1, premium: false, author: "Pedro A." },
  { id: 4, title: "High Press Trigger Training", category: "Tactical", age: "U17", difficulty: "Advanced", likes: 156, views: 0.7, premium: true, author: "Carlos M." },
  { id: 5, title: "Dynamic Warm-Up Circuit", category: "Warmup", age: "All", difficulty: "Beginner", likes: 445, views: 3.5, premium: false, author: "Sofia L." },
  { id: 6, title: "Corner Kick Variations", category: "Set Piece", age: "Senior", difficulty: "Intermediate", likes: 198, views: 1.4, premium: false, author: "João F." },
  { id: 7, title: "Progressive Build-Up Play", category: "Tactical", age: "U15", difficulty: "Advanced", likes: 267, views: 1.8, premium: true, author: "Miguel S." },
  { id: 8, title: "Speed Dribbling Gates", category: "Dribbling", age: "U12", difficulty: "Beginner", likes: 389, views: 2.9, premium: false, author: "Ana R." },
];

const difficultyColors: Record<string, string> = {
  Beginner: "bg-green-500/10 text-green-400 border-green-500/20",
  Intermediate: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Advanced: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function ExercisesPage() {
  return (
    <div className="space-y-6">
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-2xl font-bold text-foreground">Exercise Library</h1>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search exercises..."
              className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <button className="p-2.5 rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors">
            <Filter size={16} />
          </button>
        </div>
      </motion.div>

      {/* Categories */}
      <motion.div
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {categories.map((cat, i) => (
          <button
            key={cat}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              i === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </motion.div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {exercises.map((ex, i) => (
          <motion.div
            key={ex.id}
            className="glass-card-hover overflow-hidden group cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
          >
            {/* Placeholder diagram */}
            <div className="aspect-[4/3] bg-gradient-to-br from-primary/5 to-accent/5 relative flex items-center justify-center">
              <div className="w-16 h-24 border-2 border-primary/20 rounded-lg" />
              <div className="absolute top-2 right-2 flex gap-1">
                {ex.premium && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs">
                    <Lock size={10} /> Premium
                  </span>
                )}
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-foreground text-sm mb-2 group-hover:text-primary transition-colors">{ex.title}</h3>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge variant="outline" className="text-xs border-border text-muted-foreground">{ex.category}</Badge>
                <Badge variant="outline" className="text-xs border-border text-muted-foreground">{ex.age}</Badge>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${difficultyColors[ex.difficulty]}`}>
                  {ex.difficulty}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{ex.author}</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><Star size={12} /> {ex.likes}</span>
                  <span className="flex items-center gap-1"><Eye size={12} /> {ex.views}k</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
