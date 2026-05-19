import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import { userSettings } from '../db';
import { updateUserSettingsSchema } from '../../shared/validators';

export const settingsRouter = router({
    me: protectedProcedure.query(async ({ ctx }) => {
        const settings = await userSettings.getOrCreate(ctx.user.id);
        if (!settings) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to load user settings',
            });
        }
        return settings;
    }),

    update: protectedProcedure
        .input(updateUserSettingsSchema)
        .mutation(async ({ ctx, input }) => {
            const settings = await userSettings.update(ctx.user.id, input);
            if (!settings) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to update user settings',
                });
            }
            return settings;
        }),
});
