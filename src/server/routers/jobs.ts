import { z } from 'zod';
import { router, publicProcedure, protectedProcedure, clubProcedure } from '../trpc';
import { uuidSchema } from '../../shared/validators';
import { TRPCError } from '@trpc/server';
import type { JobListing, JobApplication, PaginatedResponse } from '../../shared/types';

const db = {
    listJobs: async (params: { page?: number; pageSize?: number; job_type?: string; location?: string }): Promise<PaginatedResponse<JobListing>> => {
        console.log('listJobs:', params);
        return { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
    },
    getJobById: async (id: string): Promise<JobListing | null> => {
        console.log('getJobById:', { id });
        return null;
    },
    createJob: async (data: Partial<JobListing>): Promise<JobListing> => {
        console.log('createJob:', { data });
        return { ...data, id: 'mock-id' } as JobListing;
    },
    updateJob: async (id: string, data: Partial<JobListing>): Promise<JobListing> => {
        console.log('updateJob:', { id, data });
        return { ...data, id } as JobListing;
    },
    deleteJob: async (id: string): Promise<void> => {
        console.log('deleteJob:', { id });
    },
    getApplications: async (listingId: string): Promise<JobApplication[]> => {
        console.log('getApplications:', { listingId });
        return [];
    },
    apply: async (data: Partial<JobApplication>): Promise<JobApplication> => {
        console.log('apply:', { data });
        return { ...data, id: 'mock-id' } as JobApplication;
    },
    updateApplicationStatus: async (id: string, status: string): Promise<void> => {
        console.log('updateApplicationStatus:', { id, status });
    },
    getMyApplications: async (userId: string): Promise<(JobApplication & { listing: JobListing })[]> => {
        console.log('getMyApplications:', { userId });
        return [];
    },
};

const createJobSchema = z.object({
    title: z.string().min(1).max(255),
    description: z.string().min(1),
    job_type: z.enum(['head_coach', 'assistant_coach', 'goalkeeper_coach', 'scout', 'video_analyst', 'physio', 'fitness_coach', 'director', 'other']),
    age_group: z.string().optional(),
    is_paid: z.boolean().default(true),
    salary_range: z.string().optional(),
    location: z.string().optional(),
    application_deadline: z.string().optional(),
});

export const jobsRouter = router({
    // List jobs
    list: publicProcedure
        .input(z.object({ page: z.number().min(1).default(1), pageSize: z.number().min(1).max(100).default(20), job_type: z.string().optional(), location: z.string().optional() }))
        .query(async ({ input }) => {
            return db.listJobs(input);
        }),

    // Get job by ID
    getById: publicProcedure
        .input(uuidSchema)
        .query(async ({ input }) => {
            const job = await db.getJobById(input);
            if (!job) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' });
            }
            return job;
        }),

    // Create job (clubs only)
    create: clubProcedure
        .input(createJobSchema)
        .mutation(async ({ ctx, input }) => {
            return db.createJob({
                ...input,
                club_id: ctx.profile!.id,
                is_active: true,
                applications_count: 0,
            } as Partial<JobListing>);
        }),

    // Update job
    update: protectedProcedure
        .input(z.object({ id: uuidSchema, data: createJobSchema.partial() }))
        .mutation(async ({ ctx, input }) => {
            const job = await db.getJobById(input.id);
            if (!job) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' });
            }
            // Verify ownership
            return db.updateJob(input.id, input.data as Partial<JobListing>);
        }),

    // Delete job
    delete: protectedProcedure
        .input(uuidSchema)
        .mutation(async ({ ctx, input }) => {
            const job = await db.getJobById(input);
            if (!job) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' });
            }
            await db.deleteJob(input);
            return { success: true };
        }),

    // Get applications for a job
    getApplications: protectedProcedure
        .input(uuidSchema)
        .query(async ({ ctx, input }) => {
            const job = await db.getJobById(input);
            if (!job) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' });
            }
            return db.getApplications(input);
        }),

    // Apply for a job
    apply: protectedProcedure
        .input(z.object({ listing_id: uuidSchema, cover_letter: z.string().optional(), cv_url: z.string().optional() }))
        .mutation(async ({ ctx, input }) => {
            return db.apply({
                ...input,
                applicant_id: ctx.user!.id,
                status: 'pending',
            });
        }),

    // Update application status
    updateApplicationStatus: protectedProcedure
        .input(z.object({ id: uuidSchema, status: z.enum(['pending', 'reviewed', 'accepted', 'rejected']) }))
        .mutation(async ({ ctx, input }) => {
            await db.updateApplicationStatus(input.id, input.status);
            return { success: true };
        }),

    // Get my applications
    getMyApplications: protectedProcedure
        .query(async ({ ctx }) => {
            return db.getMyApplications(ctx.user!.id);
        }),
});