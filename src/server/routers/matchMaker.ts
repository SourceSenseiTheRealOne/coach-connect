import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { matchRequests, supabase } from '../db';
import { uuidSchema, createMatchRequestSchema, acceptMatchRequestSchema } from '../../shared/validators';

export const matchMakerRouter = router({
    // List match requests
    list: protectedProcedure
        .query(async ({ ctx }) => {
            return matchRequests.list({
                page: 1,
                pageSize: 50,
                status: 'open',
            });
        }),

    // Get by ID
    getById: protectedProcedure
        .input(uuidSchema)
        .query(async ({ input }) => {
            const request = await matchRequests.getById(input);
            if (!request) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Match request not found' });
            }
            return request;
        }),

    // Create request
    create: protectedProcedure
        .input(createMatchRequestSchema)
        .mutation(async ({ ctx, input }) => {
            const request = await matchRequests.create({
                ...input,
                requester_id: ctx.user!.id,
                status: 'open',
            });
            if (!request) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create match request' });
            }
            return request;
        }),

    // Accept request
    accept: protectedProcedure
        .input(acceptMatchRequestSchema)
        .mutation(async ({ ctx, input }) => {
            const existing = await matchRequests.getById(input.request_id);
            if (!existing) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Match request not found' });
            }

            // Accept the request - this creates a match
            const success = await matchRequests.accept(input.request_id, ctx.user!.id, '');
            if (!success) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to accept match request' });
            }
            return { success: true };
        }),

    // Cancel own request
    cancel: protectedProcedure
        .input(uuidSchema)
        .mutation(async ({ ctx, input }) => {
            const existing = await matchRequests.getById(input);
            if (!existing) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Match request not found' });
            }
            if (existing.requester_id !== ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only cancel your own requests' });
            }

            // Update status to cancelled
            const { error } = await supabase
                .from('match_requests')
                .update({ status: 'cancelled' })
                .eq('id', input);

            if (error) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to cancel match request' });
            }
            return { success: true };
        }),
});