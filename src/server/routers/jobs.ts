import { router, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { jobs } from '../db';
import {
    uuidSchema,
    listJobsSchema,
    createJobListingSchema,
    updateJobListingSchema,
    applyToJobSchema,
    updateApplicationStatusSchema,
} from '../../shared/validators';

export const jobsRouter = router({
    // List job listings
    list: publicProcedure
        .input(listJobsSchema)
        .query(async ({ input }) => {
            return jobs.list({
                ...input,
                page: input.page ?? 1,
                pageSize: input.pageSize ?? 20,
                is_active: input.is_active ?? true,
            });
        }),

    // Get by ID
    getById: publicProcedure
        .input(uuidSchema)
        .query(async ({ input }) => {
            const job = await jobs.getById(input);
            if (!job) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Job listing not found' });
            }
            return job;
        }),

    // Create
    create: protectedProcedure
        .input(createJobListingSchema)
        .mutation(async ({ ctx, input }) => {
            const job = await jobs.create({
                ...input,
                club_id: ctx.user!.id,
                is_active: true,
                applications_count: 0,
            });
            if (!job) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create job listing' });
            }
            return job;
        }),

    // Update
    update: protectedProcedure
        .input(updateJobListingSchema.extend({ id: uuidSchema }))
        .mutation(async ({ ctx, input }) => {
            const { id, ...updates } = input;

            const existing = await jobs.getById(id);
            if (!existing) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Job listing not found' });
            }
            if (existing.club_id !== ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only edit your own job listings' });
            }

            const job = await jobs.update(id, updates);
            if (!job) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update job listing' });
            }
            return job;
        }),

    // Delete
    delete: protectedProcedure
        .input(uuidSchema)
        .mutation(async ({ ctx, input }) => {
            const existing = await jobs.getById(input);
            if (!existing) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Job listing not found' });
            }
            if (existing.club_id !== ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only delete your own job listings' });
            }

            const success = await jobs.delete(input);
            if (!success) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete job listing' });
            }
            return { success: true };
        }),

    // Applications
    getApplications: protectedProcedure
        .input(uuidSchema)
        .query(async ({ ctx, input }) => {
            const job = await jobs.getById(input);
            if (!job || job.club_id !== ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only view applications for your own listings' });
            }
            return jobs.getApplications(input);
        }),

    getMyApplication: protectedProcedure
        .input(uuidSchema)
        .query(async ({ ctx, input }) => {
            return jobs.getApplicationByUser(input, ctx.user!.id);
        }),

    submitApplication: protectedProcedure
        .input(applyToJobSchema)
        .mutation(async ({ ctx, input }) => {
            const existing = await jobs.getApplicationByUser(input.listing_id, ctx.user!.id);
            if (existing) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'You have already applied to this job' });
            }

            const application = await jobs.apply({
                ...input,
                applicant_id: ctx.user!.id,
                status: 'pending',
            });
            if (!application) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to apply for job' });
            }
            return application;
        }),

    updateApplicationStatus: protectedProcedure
        .input(updateApplicationStatusSchema)
        .mutation(async ({ ctx, input }) => {
            const application = await jobs.updateApplicationStatus(input.application_id, input.status);
            if (!application) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update application status' });
            }
            return application;
        }),
});