import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { planner } from '../db';
import {
    uuidSchema,
    createSeasonPlanSchema,
    updateSeasonPlanSchema,
    createTrainingSessionSchema,
    updateTrainingSessionSchema,
    addExerciseToSessionSchema,
} from '../../shared/validators';

export const plannerRouter = router({
    // Season Plans
    getSeasonPlans: protectedProcedure
        .query(async ({ ctx }) => {
            return planner.getSeasonPlans(ctx.user!.id);
        }),

    getSeasonPlanById: protectedProcedure
        .input(uuidSchema)
        .query(async ({ input }) => {
            const plan = await planner.getSeasonPlanById(input);
            if (!plan) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Season plan not found' });
            }
            return plan;
        }),

    createSeasonPlan: protectedProcedure
        .input(createSeasonPlanSchema)
        .mutation(async ({ ctx, input }) => {
            const plan = await planner.createSeasonPlan({
                ...input,
                owner_id: ctx.user!.id,
            });
            if (!plan) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create season plan' });
            }
            return plan;
        }),

    updateSeasonPlan: protectedProcedure
        .input(updateSeasonPlanSchema.extend({ id: uuidSchema }))
        .mutation(async ({ input }) => {
            const { id, ...updates } = input;
            const plan = await planner.updateSeasonPlan(id, updates);
            if (!plan) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update season plan' });
            }
            return plan;
        }),

    deleteSeasonPlan: protectedProcedure
        .input(uuidSchema)
        .mutation(async ({ input }) => {
            const success = await planner.deleteSeasonPlan(input);
            if (!success) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete season plan' });
            }
            return { success: true };
        }),

    // Training Sessions
    getTrainingSessions: protectedProcedure
        .input(uuidSchema)
        .query(async ({ input }) => {
            return planner.getTrainingSessions(input);
        }),

    createTrainingSession: protectedProcedure
        .input(createTrainingSessionSchema)
        .mutation(async ({ ctx, input }) => {
            const session = await planner.createTrainingSession({
                ...input,
                sort_order: 0,
            });
            if (!session) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create training session' });
            }
            return session;
        }),

    updateTrainingSession: protectedProcedure
        .input(updateTrainingSessionSchema.extend({ id: uuidSchema }))
        .mutation(async ({ input }) => {
            const { id, ...updates } = input;
            const session = await planner.updateTrainingSession(id, updates);
            if (!session) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update training session' });
            }
            return session;
        }),

    deleteTrainingSession: protectedProcedure
        .input(uuidSchema)
        .mutation(async ({ input }) => {
            const success = await planner.deleteTrainingSession(input);
            if (!success) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete training session' });
            }
            return { success: true };
        }),

    // Session Exercises
    getSessionExercises: protectedProcedure
        .input(uuidSchema)
        .query(async ({ input }) => {
            return planner.getSessionExercises(input);
        }),

    addExerciseToSession: protectedProcedure
        .input(addExerciseToSessionSchema)
        .mutation(async ({ input }) => {
            const sessionExercise = await planner.addExerciseToSession(input);
            if (!sessionExercise) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to add exercise to session' });
            }
            return sessionExercise;
        }),

    removeExerciseFromSession: protectedProcedure
        .input(uuidSchema)
        .mutation(async ({ input }) => {
            const success = await planner.removeExerciseFromSession(input);
            if (!success) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to remove exercise from session' });
            }
            return { success: true };
        }),
});