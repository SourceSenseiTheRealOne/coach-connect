import { router, publicProcedure, protectedProcedure, createTierProtectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { jobs, messaging } from '../db';
import { getSupabaseServerClient } from '../../lib/supabase-server';
import {
    uuidSchema,
    listJobsSchema,
    createJobListingSchema,
    updateJobListingSchema,
    applyToJobSchema,
    updateApplicationStatusSchema,
} from '../../shared/validators';

// Any paid tier is allowed to post a job listing
const paidTierJobProcedure = createTierProtectedProcedure([
    'premium_coach',
    'pro_service',
    'club_license',
]);

// Returns true if the given user is the creator of the listing,
// or a club admin of the listing's club.
async function isJobOwner(
    listing: { created_by_id?: string | null; club_id?: string | null },
    userId: string,
): Promise<boolean> {
    if (listing.created_by_id && listing.created_by_id === userId) return true;
    if (!listing.club_id) return false;
    const supabase = getSupabaseServerClient();
    const { data } = await supabase
        .from('club_members')
        .select('club_id')
        .eq('user_id', userId)
        .eq('club_id', listing.club_id)
        .eq('role', 'admin')
        .limit(1)
        .maybeSingle();
    return !!data;
}

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

    contactCreator: protectedProcedure
        .input(uuidSchema)
        .mutation(async ({ ctx, input }) => {
            const job = await jobs.getById(input);
            if (!job || !job.is_active) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Job listing not found' });
            }
            if (!job.created_by_id) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'This job creator cannot be contacted' });
            }
            if (job.created_by_id === ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'You cannot message yourself' });
            }

            const conversation = await messaging.getOrCreateDirectConversation(ctx.user!.id, job.created_by_id);
            if (!conversation) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to start conversation' });
            }
            return conversation;
        }),

    // Create — any paid tier can post a job listing.
    // For club accounts we still try to attach the listing to their club; for individual
    // paid users we only set `created_by_id` so they can be reached via messaging.
    create: paidTierJobProcedure
        .input(createJobListingSchema)
        .mutation(async ({ ctx, input }) => {
            let clubId: string | null = null;

            if (ctx.profile?.user_type === 'club') {
                const supabase = getSupabaseServerClient();
                const { data: clubMember } = await supabase
                    .from('club_members')
                    .select('club_id')
                    .eq('user_id', ctx.user!.id)
                    .eq('role', 'admin')
                    .limit(1)
                    .maybeSingle();
                clubId = clubMember?.club_id ?? null;
            }

            const job = await jobs.create({
                ...input,
                club_id: clubId,
                created_by_id: ctx.user!.id,
                is_active: true,
                applications_count: 0,
            });
            if (!job) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create job listing' });
            }
            return job;
        }),

    // Helper: a user owns a listing if they are the creator, or a club admin
    // for the listing's club.
    // Update
    update: protectedProcedure
        .input(updateJobListingSchema.extend({ id: uuidSchema }))
        .mutation(async ({ ctx, input }) => {
            const { id, ...updates } = input;

            const existing = await jobs.getById(id);
            if (!existing) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Job listing not found' });
            }
            if (!(await isJobOwner(existing, ctx.user!.id))) {
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
            if (!(await isJobOwner(existing, ctx.user!.id))) {
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
            if (!job || !(await isJobOwner(job, ctx.user!.id))) {
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
            const existingApplication = await jobs.getApplicationById(input.application_id);
            if (!existingApplication) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Application not found' });
            }

            const listing = await jobs.getById(existingApplication.listing_id);
            if (!listing || !(await isJobOwner(listing, ctx.user!.id))) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only update applications for your own listings' });
            }

            const application = await jobs.updateApplicationStatus(input.application_id, input.status);
            if (!application) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update application status' });
            }
            return application;
        }),
});
