import { z } from 'zod';
import { router, publicProcedure, protectedProcedure, clubProcedure } from '../trpc';
import { uuidSchema } from '../../shared/validators';
import { TRPCError } from '@trpc/server';
import type { ClubProfile, ClubStaff, PaginatedResponse } from '../../shared/types';

const db = {
    listClubs: async (params: { page?: number; pageSize?: number; district?: string }): Promise<PaginatedResponse<ClubProfile>> => {
        console.log('listClubs:', params);
        return { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
    },
    getClubById: async (id: string): Promise<ClubProfile | null> => {
        console.log('getClubById:', { id });
        return null;
    },
    updateClubProfile: async (id: string, data: Partial<ClubProfile>): Promise<ClubProfile> => {
        console.log('updateClubProfile:', { id, data });
        return { ...data, id } as ClubProfile;
    },
    getClubStaff: async (clubId: string): Promise<ClubStaff[]> => {
        console.log('getClubStaff:', { clubId });
        return [];
    },
    addStaffMember: async (data: Partial<ClubStaff>): Promise<ClubStaff> => {
        console.log('addStaffMember:', { data });
        return { ...data, id: 'mock-id' } as ClubStaff;
    },
    removeStaffMember: async (id: string): Promise<void> => {
        console.log('removeStaffMember:', { id });
    },
    verifyClub: async (id: string): Promise<void> => {
        console.log('verifyClub:', { id });
    },
};

const updateClubSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(2000).optional(),
    logo_url: z.string().url().optional(),
    website: z.string().url().optional(),
    city: z.string().optional(),
    district: z.string().optional(),
    founded_year: z.number().min(1800).max(new Date().getFullYear()).optional(),
});

export const clubRouter = router({
    // List clubs
    list: publicProcedure
        .input(z.object({ page: z.number().min(1).default(1), pageSize: z.number().min(1).max(100).default(20), district: z.string().optional() }))
        .query(async ({ input }) => {
            return db.listClubs(input);
        }),

    // Get club by ID
    getById: publicProcedure
        .input(uuidSchema)
        .query(async ({ input }) => {
            const club = await db.getClubById(input);
            if (!club) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Club not found' });
            }
            return club;
        }),

    // Update club profile (clubs only)
    updateProfile: clubProcedure
        .input(updateClubSchema)
        .mutation(async ({ ctx, input }) => {
            return db.updateClubProfile(ctx.profile!.id, input as Partial<ClubProfile>);
        }),

    // Get club staff
    getStaff: publicProcedure
        .input(uuidSchema)
        .query(async ({ input }) => {
            return db.getClubStaff(input);
        }),

    // Add staff member (clubs only)
    addStaff: clubProcedure
        .input(z.object({ user_id: uuidSchema, role: z.string().min(1), title: z.string().optional() }))
        .mutation(async ({ ctx, input }) => {
            return db.addStaffMember({
                ...input,
                club_id: ctx.profile!.id,
            });
        }),

    // Remove staff member (clubs only)
    removeStaff: clubProcedure
        .input(uuidSchema)
        .mutation(async ({ ctx, input }) => {
            // Would verify the staff member belongs to this club
            await db.removeStaffMember(input);
            return { success: true };
        }),
});