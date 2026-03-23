import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

const db = {
    createUploadUrl: async (fileName: string, fileType: string, userId: string): Promise<{ uploadUrl: string; fileUrl: string }> => {
        console.log('createUploadUrl:', { fileName, fileType, userId });
        return { uploadUrl: 'https://mock-presigned-url.com', fileUrl: 'https://mock-file-url.com' };
    },
    deleteFile: async (fileUrl: string): Promise<void> => {
        console.log('deleteFile:', { fileUrl });
    },
};

export const uploadRouter = router({
    // Get presigned URL for upload
    getUploadUrl: protectedProcedure
        .input(z.object({ fileName: z.string().min(1), fileType: z.string().min(1) }))
        .mutation(async ({ ctx, input }) => {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf'];
            if (!allowedTypes.includes(input.fileType)) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'File type not allowed' });
            }

            const { uploadUrl, fileUrl } = await db.createUploadUrl(input.fileName, input.fileType, ctx.user!.id);
            return { uploadUrl, fileUrl };
        }),

    // Delete file
    deleteFile: protectedProcedure
        .input(z.object({ fileUrl: z.string().min(1) }))
        .mutation(async ({ input }) => {
            await db.deleteFile(input.fileUrl);
            return { success: true };
        }),
});