import { motion } from "framer-motion";
import { Search, MapPin, Clock, Users, Briefcase, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const jobs = [
  {
    id: 1,
    title: "Head Coach — U17 Team",
    club: "SL Benfica",
    location: "Lisboa",
    type: "head_coach",
    age: "U17",
    posted: "2 days ago",
    applications: 23,
    salary: "€2,500-3,500/mo",
  },
  {
    id: 2,
    title: "Assistant Coach — Senior Team",
    club: "SC Braga",
    location: "Braga",
    type: "assistant_coach",
    age: "Senior",
    posted: "5 days ago",
    applications: 45,
    salary: "€1,800-2,500/mo",
  },
  {
    id: 3,
    title: "Goalkeeper Coach",
    club: "Vitória SC",
    location: "Guimarães",
    type: "goalkeeper_coach",
    age: "U15-U19",
    posted: "1 week ago",
    applications: 12,
    salary: "Contact club",
  },
  {
    id: 4,
    title: "Video Analyst",
    club: "FC Porto Academy",
    location: "Porto",
    type: "video_analyst",
    age: "All",
    posted: "3 days ago",
    applications: 31,
    salary: "€1,500-2,000/mo",
  },
  {
    id: 5,
    title: "Fitness Coach — Youth Teams",
    club: "Sporting CP",
    location: "Lisboa",
    type: "fitness_coach",
    age: "U14-U17",
    posted: "1 day ago",
    applications: 8,
    salary: "€1,200-1,800/mo",
  },
];

export default function JobsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-2xl font-bold text-foreground">Job Board</h1>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search positions..."
              className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <button className="p-2.5 rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors">
            <Filter size={16} />
          </button>
        </div>
      </motion.div>

      <div className="space-y-3">
        {jobs.map((job, i) => (
          <motion.div
            key={job.id}
            className="glass-card-hover p-5 cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Briefcase size={20} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground mb-1">{job.title}</h3>
                <p className="text-sm text-primary font-medium mb-2">{job.club}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
                  <span className="flex items-center gap-1"><Users size={12} /> {job.age}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {job.posted}</span>
                  <Badge variant="outline" className="text-xs border-border text-muted-foreground">{job.salary}</Badge>
                </div>
              </div>
              <div className="text-right shrink-0 hidden sm:block">
                <div className="text-xs text-muted-foreground mb-2">{job.applications} applicants</div>
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">Apply</Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
