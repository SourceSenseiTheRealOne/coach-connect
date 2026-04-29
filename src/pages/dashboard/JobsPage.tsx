import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  MapPin,
  Clock,
  Users,
  Briefcase,
  Filter,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useJobs } from "@/hooks/use-jobs";

export default function JobsPage() {
  const { data: jobsData, isLoading, error } = useJobs();
  const [searchQuery, setSearchQuery] = useState("");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Failed to load jobs</p>
      </div>
    );
  }

  const jobs = jobsData?.items || [];
  const filteredJobs = jobs.filter(
    (job) =>
      job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-2xl font-bold text-foreground">
          Job Board
        </h1>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Search positions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <button className="p-2.5 rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors">
            <Filter size={16} />
          </button>
        </div>
      </motion.div>

      <div className="space-y-3">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No jobs found matching your search
          </div>
        ) : (
          filteredJobs.map((job, i) => (
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
                  <h3 className="font-semibold text-foreground mb-1">
                    {job.title}
                  </h3>
                  <p className="text-sm text-primary font-medium mb-2">
                    {job.job_type}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={12} /> {job.age_group}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />{" "}
                      {new Date(job.created_at || "").toLocaleDateString()}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-xs border-border text-muted-foreground"
                    >
                      {job.salary_range || "Contact club"}
                    </Badge>
                  </div>
                </div>
                <div className="text-right shrink-0 hidden sm:block">
                  <div className="text-xs text-muted-foreground mb-2">
                    {job.applications_count} applicants
                  </div>
                  <Button
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
