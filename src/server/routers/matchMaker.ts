import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { uuidSchema } from '../../shared/validators';
import { TRPCError } from '@trpc/server';
import type { MatchRequest, PaginatedResponse } from '../../shared/types';

const db = {
    listOpenRequests: async (params: { page?: number; pageSize?: number; age_group?: string; district?: string }): Promise<PaginatedResponse<MatchRequest>> => {
        console.log('listOpenRequests:', params);
        return { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
    },
    getRequestById: async (id: string): Promise<MatchRequest | null> => {
        console.log('getRequestById:', { id });
        return null;
    },
    createRequest: async (data: Partial<MatchRequest>): Promise<MatchRequest> => {
        console.log('createRequest:', { data });
        return { ...data, id: 'mock-id' } as MatchRequest;
    },
    cancelRequest: async (id: string): Promise<void> => {
        console.log('cancelRequest:', { id });
    },
    acceptRequest: async (requestId: string, acceptedBy: string): Promise<string> => {
        console.log('acceptRequest:', { requestId, acceptedBy });
        return 'mock-match-id';
    },
    getMyRequests: async (userId: string): Promise<MatchRequest[]> => {
        console.log('getMyRequests:', { userId });
        return [];
    },
};

const createRequestSchema = z.object({
    team_name: z.string().min(1),
    age_group: z.string(),
    preferred_date: z.string().optional(),
    preferred_time: z.string().optional(),
    location_preference: z.string().optional(),
    district: z.string().optional(),
    message: z.string().optional(),
});

export const matchMakerRouter = router({
    // List open match requests
    listOpen: publicProcedure
        .input(z.object({ page: z.number().min(1).default(1), pageSize: z.number().min(1).max(100).default(20), age_group: z.string().optional(), district: z.string().optional() }))
        .query(async ({ input }) => {
            return db.listOpenRequests(input);
        }),

    // Get request by ID
    getById: publicProcedure
        .input(uuidSchema)
        .query(async ({ input }) => {
            const request = await db.getRequestById(input);
            if (!request) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Request not found' });
            }
            return request;
        }),

    // Create match request
    create: protectedProcedure
        .input(createRequestSchema)
        .mutation(async ({ ctx, input }) => {
            return db.createRequest({
                ...input,
                requester_id: ctx.user!.id,
                status: 'open',
            } as Partial<MatchRequest>);
        }),

    // Cancel match request
    cancel: protectedProcedure
        .input(uuidSchema)
        .mutation(async ({ ctx, input }) => {
            const request = await db.getRequestById(input);
            if (!request) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Request not found' });
            }
            if (request.requester_id !== ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
            }
            await db.cancelRequest(input);
            return { success: true };
        }),

    // Accept match request
    accept: protectedProcedure
        .input(uuidSchema)
        .mutation(async ({ ctx, input }) => {
            const request = await db.getRequestById(input);
            if (!request) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Request not found' });
            }
            if (request.status !== 'open') {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Request is no longer open' });
            }
            const matchId = await db.acceptRequest(input, ctx.user!.id);
            return { matchId };
        }),

    // Get my requests
    getMyRequests: protectedProcedure
        .query(async ({ ctx }) => {
            return db.getMyRequests(ctx.user!.id);
        }),
});