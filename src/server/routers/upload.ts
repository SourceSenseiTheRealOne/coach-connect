import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { storage } from '../db';
import { z } from 'zod';

export const uploadRouter = router({
    // Create signed upload URL
    createUploadUrl: protectedProcedure
        .input(z.object({
            bucket: z.string(),
            filename: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            const result = await storage.createUploadUrl(
                input.bucket,
                input.filename,
                ctx.user!.id
            );

            if (!result) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to create upload URL',
                });
            }

            return result;
        }),

    // Get public URL
    getPublicUrl: protectedProcedure
        .input(z.object({
            bucket: z.string(),
            path: z.string(),
        }))
        .query(async ({ input }) => {
            return storage.getPublicUrl(input.bucket, input.path);
        }),

    // Delete file
    deleteFile: protectedProcedure
        .input(z.object({
            bucket: z.string(),
            path: z.string(),
        }))
        .mutation(async ({ input }) => {
            const success = await storage.deleteFile(input.bucket, input.path);
            if (!success) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to delete file',
                });
            }
            return { success: true };
        }),
});