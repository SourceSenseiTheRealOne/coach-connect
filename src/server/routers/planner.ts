import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import {
    createSeasonPlanSchema,
    updateSeasonPlanSchema,
    createTrainingSessionSchema,
    updateTrainingSessionSchema,
    addExerciseToSessionSchema,
    uuidSchema,
} from '../../shared/validators';
import { TRPCError } from '@trpc/server';
import type { SeasonPlan, TrainingSession, SessionExercise } from '../../shared/types';

// Placeholder database functions
const db = {
    getPlans: async (ownerId: string): Promise<SeasonPlan[]> => {
        console.log('getPlans:', { ownerId });
        return [];
    },
    getPlanById: async (id: string): Promise<SeasonPlan | null> => {
        console.log('getPlanById:', { id });
        return null;
    },
    createPlan: async (data: Partial<SeasonPlan>): Promise<SeasonPlan> => {
        console.log('createPlan:', { data });
        return { ...data, id: 'mock-id' } as SeasonPlan;
    },
    updatePlan: async (id: string, data: Partial<SeasonPlan>): Promise<SeasonPlan> => {
        console.log('updatePlan:', { id, data });
        return { ...data, id } as SeasonPlan;
    },
    deletePlan: async (id: string): Promise<void> => {
        console.log('deletePlan:', { id });
    },
    getSessions: async (planId: string): Promise<TrainingSession[]> => {
        console.log('getSessions:', { planId });
        return [];
    },
    getSessionById: async (id: string): Promise<TrainingSession | null> => {
        console.log('getSessionById:', { id });
        return null;
    },
    createSession: async (data: Partial<TrainingSession>): Promise<TrainingSession> => {
        console.log('createSession:', { data });
        return { ...data, id: 'mock-id' } as TrainingSession;
    },
    updateSession: async (id: string, data: Partial<TrainingSession>): Promise<TrainingSession> => {
        console.log('updateSession:', { id, data });
        return { ...data, id } as TrainingSession;
    },
    deleteSession: async (id: string): Promise<void> => {
        console.log('deleteSession:', { id });
    },
    getSessionExercises: async (sessionId: string): Promise<SessionExercise[]> => {
        console.log('getSessionExercises:', { sessionId });
        return [];
    },
    addExerciseToSession: async (data: Partial<SessionExercise>): Promise<SessionExercise> => {
        console.log('addExerciseToSession:', { data });
        return { ...data, id: 'mock-id' } as SessionExercise;
    },
    removeExerciseFromSession: async (id: string): Promise<void> => {
        console.log('removeExerciseFromSession:', { id });
    },
    reorderSessionExercises: async (sessionId: string, exerciseIds: string[]): Promise<void> => {
        console.log('reorderSessionExercises:', { sessionId, exerciseIds });
    },
};

export const plannerRouter = router({
    // List user's season plans
    list: protectedProcedure
        .query(async ({ ctx }) => {
            return db.getPlans(ctx.user!.id);
        }),

    // Get plan by ID with sessions
    getById: protectedProcedure
        .input(uuidSchema)
        .query(async ({ ctx, input }) => {
            const plan = await db.getPlanById(input);
            if (!plan) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Plan not found' });
            }
            if (plan.owner_id !== ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
            }
            const sessions = await db.getSessions(input);
            return { ...plan, sessions };
        }),

    // Create season plan
    create: protectedProcedure
        .input(createSeasonPlanSchema)
        .mutation(async ({ ctx, input }) => {
            return db.createPlan({ ...input, owner_id: ctx.user!.id });
        }),

    // Update season plan
    update: protectedProcedure
        .input(updateSeasonPlanSchema.extend({ id: uuidSchema }))
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            const plan = await db.getPlanById(id);
            if (!plan || plan.owner_id !== ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
            }
            return db.updatePlan(id, data);
        }),

    // Delete season plan
    delete: protectedProcedure
        .input(uuidSchema)
        .mutation(async ({ ctx, input }) => {
            const plan = await db.getPlanById(input);
            if (!plan || plan.owner_id !== ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
            }
            await db.deletePlan(input);
            return { success: true };
        }),

    // Create training session
    createSession: protectedProcedure
        .input(createTrainingSessionSchema)
        .mutation(async ({ ctx, input }) => {
            const plan = await db.getPlanById(input.plan_id);
            if (!plan || plan.owner_id !== ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
            }
            return db.createSession(input);
        }),

    // Update training session
    updateSession: protectedProcedure
        .input(updateTrainingSessionSchema.extend({ id: uuidSchema }))
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            const session = await db.getSessionById(id);
            if (!session) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found' });
            }
            const plan = await db.getPlanById(session.plan_id);
            if (!plan || plan.owner_id !== ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
            }
            return db.updateSession(id, data);
        }),

    // Delete training session
    deleteSession: protectedProcedure
        .input(uuidSchema)
        .mutation(async ({ ctx, input }) => {
            const session = await db.getSessionById(input);
            if (!session) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found' });
            }
            const plan = await db.getPlanById(session.plan_id);
            if (!plan || plan.owner_id !== ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
            }
            await db.deleteSession(input);
            return { success: true };
        }),

    // Add exercise to session
    addExerciseToSession: protectedProcedure
        .input(addExerciseToSessionSchema)
        .mutation(async ({ ctx, input }) => {
            const session = await db.getSessionById(input.session_id);
            if (!session) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found' });
            }
            const plan = await db.getPlanById(session.plan_id);
            if (!plan || plan.owner_id !== ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
            }
            return db.addExerciseToSession(input);
        }),

    // Remove exercise from session
    removeExerciseFromSession: protectedProcedure
        .input(uuidSchema)
        .mutation(async ({ ctx, input }) => {
            // In real implementation, would fetch session exercise and verify ownership
            await db.removeExerciseFromSession(input);
            return { success: true };
        }),

    // Reorder exercises in session
    reorderSessionExercises: protectedProcedure
        .input(z.object({ id: uuidSchema, exerciseIds: z.array(uuidSchema) }))
        .mutation(async ({ ctx, input }) => {
            const { id: sessionId, exerciseIds } = input;
            const session = await db.getSessionById(sessionId);
            if (!session) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found' });
            }
            const plan = await db.getPlanById(session.plan_id);
            if (!plan || plan.owner_id !== ctx.user!.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
            }
            await db.reorderSessionExercises(sessionId, exerciseIds);
            return { success: true };
        }),

    // Get session exercises
    getSessionExercises: protectedProcedure
        .input(uuidSchema)
        .query(async ({ input }) => {
            return db.getSessionExercises(input);
        }),
});