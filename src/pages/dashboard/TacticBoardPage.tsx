import { motion } from "framer-motion";

export default function TacticBoardPage() {
  return (
    <div className="space-y-6">
      <motion.h1
        className="font-display text-2xl font-bold text-foreground"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Tactic Board
      </motion.h1>
      <motion.div
        className="glass-card aspect-[16/10] flex items-center justify-center relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Field */}
        <div className="absolute inset-8 border-2 border-primary/30 rounded-lg">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-primary/30" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-primary/30 rounded-full" />
          {/* Penalty areas */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 w-20 h-40 border-2 border-l-0 border-primary/30" />
          <div className="absolute top-1/2 -translate-y-1/2 right-0 w-20 h-40 border-2 border-r-0 border-primary/30" />
          {/* Players */}
          {[
            { x: "10%", y: "50%", label: "GK" },
            { x: "25%", y: "25%", label: "LB" },
            { x: "25%", y: "42%", label: "CB" },
            { x: "25%", y: "58%", label: "CB" },
            { x: "25%", y: "75%", label: "RB" },
            { x: "45%", y: "30%", label: "CM" },
            { x: "45%", y: "50%", label: "CM" },
            { x: "45%", y: "70%", label: "CM" },
            { x: "65%", y: "20%", label: "LW" },
            { x: "70%", y: "50%", label: "ST" },
            { x: "65%", y: "80%", label: "RW" },
          ].map((p, i) => (
            <div
              key={i}
              className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary flex items-center justify-center text-[9px] font-bold text-primary-foreground cursor-move hover:scale-110 transition-transform"
              style={{ left: p.x, top: p.y }}
            >
              {p.label}
            </div>
          ))}
        </div>
        <div className="absolute bottom-4 left-4 text-xs text-muted-foreground">
          Interactive tactic board — drag players to reposition
        </div>
      </motion.div>
    </div>
  );
}
