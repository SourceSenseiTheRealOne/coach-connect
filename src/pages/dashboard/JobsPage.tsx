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
  Plus,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useJobs,
  useCreateJob,
  useJob,
  useApplyForJob,
  useMyApplication,
} from "@/hooks/use-jobs";

export default function JobsPage() {
  const { data: jobsData, isLoading, error } = useJobs();
  const createJob = useCreateJob();
  const applyForJob = useApplyForJob();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [createJobForm, setCreateJobForm] = useState({
    title: "",
    description: "",
    job_type: "head_coach" as
      | "head_coach"
      | "assistant_coach"
      | "goalkeeper_coach"
      | "fitness_coach"
      | "physio"
      | "video_analyst"
      | "scout"
      | "director"
      | "other",
    age_group: "senior" as
      | "U7"
      | "U8"
      | "U9"
      | "U10"
      | "U11"
      | "U12"
      | "U13"
      | "U14"
      | "U15"
      | "U16"
      | "U17"
      | "U18"
      | "U19"
      | "senior",
    is_paid: true,
    salary_range: "",
    location: "",
    application_deadline: "",
  });
  const [coverLetter, setCoverLetter] = useState("");

  const { data: selectedJob } = useJob(selectedJobId);
  const { data: myApplication } = useMyApplication(selectedJobId);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createJob.mutateAsync({
        title: createJobForm.title,
        description: createJobForm.description,
        job_type: createJobForm.job_type,
        age_group: createJobForm.age_group || null,
        is_paid: createJobForm.is_paid,
        salary_range: createJobForm.salary_range || null,
        location: createJobForm.location || null,
        application_deadline: createJobForm.application_deadline || null,
      });
      setIsCreateModalOpen(false);
      setCreateJobForm({
        title: "",
        description: "",
        job_type: "head_coach",
        age_group: "senior",
        is_paid: true,
        salary_range: "",
        location: "",
        application_deadline: "",
      });
    } catch (error) {
      console.error("Failed to create job:", error);
    }
  };

  const handleViewJob = (jobId: string) => {
    setSelectedJobId(jobId);
    setIsViewModalOpen(true);
  };

  const handleApplyForJob = async () => {
    if (!selectedJobId) return;
    try {
      await applyForJob.mutateAsync({
        listing_id: selectedJobId,
        cover_letter: coverLetter || null,
        cv_url: null,
      });
      setIsViewModalOpen(false);
    } catch (error) {
      console.error("Failed to apply for job:", error);
    }
  };

  const hasApplied = !!myApplication;

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
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={16} /> Create Job
          </Button>
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
              onClick={() => handleViewJob(job.id)}
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

      {/* Create Job Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Job Listing</DialogTitle>
            <DialogDescription>
              Post a new job opportunity for coaches and staff
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateJob} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={createJobForm.title}
                onChange={(e) =>
                  setCreateJobForm({ ...createJobForm, title: e.target.value })
                }
                placeholder="e.g., Head Coach"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={createJobForm.description}
                onChange={(e) =>
                  setCreateJobForm({
                    ...createJobForm,
                    description: e.target.value,
                  })
                }
                placeholder="Describe the role, responsibilities, and requirements..."
                rows={5}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="job_type">Job Type *</Label>
                <select
                  id="job_type"
                  value={createJobForm.job_type}
                  onChange={(e) =>
                    setCreateJobForm({
                      ...createJobForm,
                      job_type: e.target.value as
                        | "head_coach"
                        | "assistant_coach"
                        | "goalkeeper_coach"
                        | "fitness_coach"
                        | "physio"
                        | "video_analyst"
                        | "scout"
                        | "director"
                        | "other",
                    })
                  }
                  className="w-full px-3 py-2 rounded-md bg-secondary border border-border text-foreground"
                >
                  <option value="head_coach">Head Coach</option>
                  <option value="assistant_coach">Assistant Coach</option>
                  <option value="goalkeeper_coach">Goalkeeper Coach</option>
                  <option value="fitness_coach">Fitness Coach</option>
                  <option value="physio">Physiotherapist</option>
                  <option value="video_analyst">Video Analyst</option>
                  <option value="scout">Scout</option>
                  <option value="director">Director</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="age_group">Age Group</Label>
                <select
                  id="age_group"
                  value={createJobForm.age_group}
                  onChange={(e) =>
                    setCreateJobForm({
                      ...createJobForm,
                      age_group: e.target.value as
                        | "U7"
                        | "U8"
                        | "U9"
                        | "U10"
                        | "U11"
                        | "U12"
                        | "U13"
                        | "U14"
                        | "U15"
                        | "U16"
                        | "U17"
                        | "U18"
                        | "U19"
                        | "senior",
                    })
                  }
                  className="w-full px-3 py-2 rounded-md bg-secondary border border-border text-foreground"
                >
                  <option value="senior">Senior</option>
                  <option value="U19">U19</option>
                  <option value="U18">U18</option>
                  <option value="U17">U17</option>
                  <option value="U16">U16</option>
                  <option value="U15">U15</option>
                  <option value="U14">U14</option>
                  <option value="U13">U13</option>
                  <option value="U12">U12</option>
                  <option value="U11">U11</option>
                  <option value="U10">U10</option>
                  <option value="U9">U9</option>
                  <option value="U8">U8</option>
                  <option value="U7">U7</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={createJobForm.location}
                  onChange={(e) =>
                    setCreateJobForm({
                      ...createJobForm,
                      location: e.target.value,
                    })
                  }
                  placeholder="e.g., Lisbon, Portugal"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary_range">Salary Range</Label>
                <Input
                  id="salary_range"
                  value={createJobForm.salary_range}
                  onChange={(e) =>
                    setCreateJobForm({
                      ...createJobForm,
                      salary_range: e.target.value,
                    })
                  }
                  placeholder="e.g., €3,000-5,000/month"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="application_deadline">Application Deadline</Label>
              <Input
                id="application_deadline"
                type="date"
                value={createJobForm.application_deadline}
                onChange={(e) =>
                  setCreateJobForm({
                    ...createJobForm,
                    application_deadline: e.target.value,
                  })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_paid"
                checked={createJobForm.is_paid}
                onChange={(e) =>
                  setCreateJobForm({
                    ...createJobForm,
                    is_paid: e.target.checked,
                  })
                }
                className="rounded border-border"
              />
              <Label htmlFor="is_paid" className="text-sm">
                This is a paid position
              </Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createJob.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {createJob.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Create Job
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Job Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedJob?.title}</DialogTitle>
            <DialogDescription>
              {selectedJob?.job_type} · {selectedJob?.location}
            </DialogDescription>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{selectedJob.job_type}</Badge>
                {selectedJob.age_group && (
                  <Badge variant="outline">{selectedJob.age_group}</Badge>
                )}
                {selectedJob.salary_range && (
                  <Badge variant="outline">{selectedJob.salary_range}</Badge>
                )}
                {selectedJob.is_paid ? (
                  <Badge className="bg-green-500/20 text-green-500 border-green-500/20">
                    Paid
                  </Badge>
                ) : (
                  <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/20">
                    Volunteer
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Description
                </Label>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {selectedJob.description}
                </p>
              </div>
              {selectedJob.application_deadline && (
                <div className="text-sm text-muted-foreground">
                  Application deadline:{" "}
                  {new Date(
                    selectedJob.application_deadline,
                  ).toLocaleDateString()}
                </div>
              )}
              <div className="text-sm text-muted-foreground">
                Posted:{" "}
                {new Date(selectedJob.created_at || "").toLocaleDateString()}
              </div>
              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="cover_letter">Cover Letter (Optional)</Label>
                <Textarea
                  id="cover_letter"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Tell the employer why you're interested in this position..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsViewModalOpen(false)}
                >
                  Close
                </Button>
                {hasApplied ? (
                  <Button
                    disabled
                    className="bg-green-500 text-white hover:bg-green-600"
                  >
                    Applied ✓
                  </Button>
                ) : (
                  <Button
                    onClick={handleApplyForJob}
                    disabled={applyForJob.isPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {applyForJob.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Apply Now
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
