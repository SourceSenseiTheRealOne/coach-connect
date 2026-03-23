import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { uuidSchema } from '../../shared/validators';
import { TRPCError } from '@trpc/server';
import type { Match, PaginatedResponse } from '../../shared/types';

const db = {
    listMatches: async (params: { page?: number; pageSize?: number; status?: string }): Promise<PaginatedResponse<Match>> => {
        console.log('listMatches:', params);
        return { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
    },
    getMatchById: async (id: string): Promise<Match | null> => {
        console.log('getMatchById:', { id });
        return null;
    },
    createMatch: async (data: Partial<Match>): Promise<Match> => {
        console.log('createMatch:', { data });
        return { ...data, id: 'mock-id' } as Match;
    },
    updateMatch: async (id: string, data: Partial<Match>): Promise<Match> => {
        console.log('updateMatch:', { id, data });
        return { ...data, id } as Match;
    },
    deleteMatch: async (id: string): Promise<void> => {
        console.log('deleteMatch:', { id });
    },
    getMatchesByUser: async (userId: string): Promise<Match[]> => {
        console.log('getMatchesByUser:', { userId });
        return [];
    },
};

const createMatchSchema = z.object({
    home_team: z.string().min(1),
    away_team: z.string().optional(),
    match_type: z.enum(['competition', 'friendly', 'tournament', 'cup']),
    age_group: z.string(),
    match_date: z.string(),
    kick_off_time: z.string().optional(),
    venue: z.string().optional(),
    city: z.string().optional(),
    district: z.string().optional(),
    is_public: z.boolean().default(true),
});

export const matchesRouter = router({
    // List matches
    list: publicProcedure
        .input(z.object({ page: z.number().min(1).default(1), pageSize: z.number().min(1).max(100).default(20), status: z.string().optional() }))
        .query(async ({ input }) => {
            return db.listMatches(input);
        }),

    // Get match by ID
    getById: publicProcedure
        .input(uuidSchema)
        .query(async ({ input }) => {
            const match = await db.getMatchById(input);
            if (!match) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Match not found' });
            }
            return match;
        }),

    // Create match
    create: protectedProcedure
        .input(createMatchSchema)
        .mutation(async ({ ctx, input }) => {
            return db.createMatch({
                ...input,
                created_by: ctx.user!.id,
                status: 'scheduled',
            } as Partial<Match>);
        }),

    // Update match
    update: protectedProcedure
        .input(z.object({ id: uuidSchema, data: createMatchSchema.partial() }))
        .mutation(async ({ ctx, input }) => {
            const match = await db.getMatchById(input.id);
            if (!match) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Match not found' });
            }
            if (match.created_by !== ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
            }
            return db.updateMatch(input.id, input.data as Partial<Match>);
        }),

    // Delete match
    delete: protectedProcedure
        .input(uuidSchema)
        .mutation(async ({ ctx, input }) => {
            const match = await db.getMatchById(input);
            if (!match) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Match not found' });
            }
            if (match.created_by !== ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
            }
            await db.deleteMatch(input);
            return { success: true };
        }),

    // Get my matches
    getMyMatches: protectedProcedure
        .query(async ({ ctx }) => {
            return db.getMatchesByUser(ctx.user!.id);
        }),

    // Update match result
    updateResult: protectedProcedure
        .input(z.object({ id: uuidSchema, home_score: z.number().min(0), away_score: z.number().min(0) }))
        .mutation(async ({ ctx, input }) => {
            const match = await db.getMatchById(input.id);
            if (!match) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Match not found' });
            }
            if (match.created_by !== ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
            }
            return db.updateMatch(input.id, {
                home_score: input.home_score,
                away_score: input.away_score,
                status: 'completed',
            });
        }),
});