import { motion } from "framer-motion";
import { Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const sessions = [
  { day: 1, title: "Passing & Movement", time: "10:00", duration: "90min" },
  { day: 2, title: "Tactical — High Press", time: "10:00", duration: "90min" },
  { day: 3, title: "Recovery / Video", time: "14:00", duration: "60min" },
  { day: 4, title: "Shooting & Finishing", time: "10:00", duration: "90min" },
  { day: 5, title: "Match Simulation", time: "10:00", duration: "120min" },
  { day: 6, title: "Match Day 🏟️", time: "15:00", duration: "90min" },
];

export default function PlannerPage() {
  return (
    <div className="space-y-6">
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-2xl font-bold text-foreground">Season Planner</h1>
        <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1">
          <Plus size={14} /> New Plan
        </Button>
      </motion.div>

      {/* Week navigation */}
      <motion.div
        className="glass-card p-4 flex items-center justify-between"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <button className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"><ChevronLeft size={18} /></button>
        <div className="flex items-center gap-2">
          <CalendarIcon size={16} className="text-primary" />
          <span className="font-display font-semibold text-foreground">Week 12 — March 17-23, 2026</span>
        </div>
        <button className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"><ChevronRight size={18} /></button>
      </motion.div>

      {/* Weekly grid */}
      <motion.div
        className="grid grid-cols-7 gap-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {days.map((day, i) => {
          const session = sessions.find(s => s.day === i);
          return (
            <div key={day} className="space-y-2">
              <div className="text-center text-xs font-medium text-muted-foreground py-2">{day}</div>
              <div
                className={`glass-card min-h-[120px] p-3 transition-all hover:border-primary/30 cursor-pointer ${
                  session ? "" : "opacity-50"
                }`}
              >
                {session ? (
                  <div className="space-y-1">
                    <div className="text-xs text-primary font-medium">{session.time}</div>
                    <div className="text-xs font-medium text-foreground leading-tight">{session.title}</div>
                    <div className="text-[10px] text-muted-foreground">{session.duration}</div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Plus size={16} className="text-muted-foreground/30" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
