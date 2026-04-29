import { trpc } from "@/lib/trpc";

// ============================================================
// QUERY KEYS
// ============================================================

export const jobsKeys = {
    all: ["jobs"] as const,
    list: () => [...jobsKeys.all, "list"] as const,
    detail: (id: string) => [...jobsKeys.all, "detail", id] as const,
};

// ============================================================
// HOOKS
// ============================================================

/**
 * Hook to fetch all job listings
 */
export function useJobs() {
    return trpc.jobs.list.useQuery(undefined, {
        staleTime: 30 * 1000,
    });
}

/**
 * Hook to fetch a single job by ID
 */
export function useJob(id: string | null) {
    return trpc.jobs.getById.useQuery(id || "", {
        enabled: !!id,
        staleTime: 30 * 1000,
    });
}

/**
 * Hook to create a new job listing
 */
export function useCreateJob() {
    const utils = trpc.useUtils();

    return trpc.jobs.create.useMutation({
        onSuccess: () => {
            utils.jobs.list.invalidate();
        },
    });
}

/**
 * Hook to update a job listing
 */
export function useUpdateJob() {
    const utils = trpc.useUtils();

    return trpc.jobs.update.useMutation({
        onSuccess: (data) => {
            utils.jobs.list.invalidate();
            utils.jobs.getById.invalidate(data.id);
        },
    });
}

/**
 * Hook to delete a job listing
 */
export function useDeleteJob() {
    const utils = trpc.useUtils();

    return trpc.jobs.delete.useMutation({
        onSuccess: () => {
            utils.jobs.list.invalidate();
        },
    });
}

/**
 * Hook to apply for a job
 */
export function useApplyForJob() {
    const utils = trpc.useUtils();

    return trpc.jobs.submitApplication.useMutation({
        onSuccess: () => {
            utils.jobs.list.invalidate();
        },
    });
}

/**
 * Hook to get applications for a job
 */
export function useJobApplications(jobId: string | null) {
    return trpc.jobs.getApplications.useQuery(jobId || "", {
        enabled: !!jobId,
        staleTime: 30 * 1000,
    });
}

/**
 * Hook to get my application for a job
 */
export function useMyApplication(jobId: string | null) {
    return trpc.jobs.getMyApplication.useQuery(jobId || "", {
        enabled: !!jobId,
        staleTime: 30 * 1000,
    });
}

/**
 * Hook to update job application status
 */
export function useUpdateApplicationStatus() {
    const utils = trpc.useUtils();

    return trpc.jobs.updateApplicationStatus.useMutation({
        onSuccess: () => {
            utils.jobs.list.invalidate();
        },
    });
}
