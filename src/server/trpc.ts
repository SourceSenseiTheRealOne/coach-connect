import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { Profile } from '../shared/types';
import type * as trpcExpress from '@trpc/server/adapters/express';
import { getSupabaseServerClient } from '../lib/supabase-server';

// Context type - will be extended with user info
export interface Context {
    user: {
        id: string;
        email: string;
    } | null;
    profile: Profile | null;
}

// Create context from Express request
export async function createContext(opts: trpcExpress.CreateExpressContextOptions): Promise<Context> {
    // Extract authorization header
    const authHeader = opts.req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return { user: null, profile: null };
    }

    const token = authHeader.slice(7);
    const supabase = getSupabaseServerClient();

    try {
        // Verify the JWT with Supabase
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return { user: null, profile: null };
        }

        // Fetch the user's profile from the database
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError) {
            // User exists in auth but no profile yet - return user without profile
            return {
                user: {
                    id: user.id,
                    email: user.email || '',
                },
                profile: null,
            };
        }

        return {
            user: {
                id: user.id,
                email: user.email || '',
            },
            profile: profile as Profile,
        };
    } catch (error) {
        console.error('Error creating context:', error);
        return { user: null, profile: null };
    }
}

// Initialize tRPC
const t = initTRPC.context<Context>().create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
        return {
            ...shape,
            data: {
                ...shape.data,
                zodError: error.cause instanceof Error ? error.cause : null,
            },
        };
    },
});

// Export reusable router and procedure builders
export const router = t.router;
export const publicProcedure = t.procedure;

// Protected procedure - requires authentication
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
    if (!ctx.user) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You must be logged in to access this resource',
        });
    }
    return next({
        ctx: {
            ...ctx,
            user: ctx.user,
            profile: ctx.profile,
        },
    });
});

// Admin procedure - requires admin role
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
    if (ctx.profile?.user_type !== 'admin') {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Admin access required',
        });
    }
    return next();
});

// Tier-protected procedure factory
export const createTierProtectedProcedure = (allowedTiers: string[]) => {
    return protectedProcedure.use(async ({ ctx, next }) => {
        const userTier = ctx.profile?.subscription_tier || 'free';
        if (!allowedTiers.includes(userTier)) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: `This feature requires one of the following tiers: ${allowedTiers.join(', ')}`,
            });
        }
        return next();
    });
};

// Club-only procedure
export const clubProcedure = protectedProcedure.use(async ({ ctx, next }) => {
    if (ctx.profile?.user_type !== 'club') {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'This action is only available for clubs',
        });
    }
    return next();
});

// Pro service procedure (for marketplace listings)
export const proServiceProcedure = protectedProcedure.use(async ({ ctx, next }) => {
    const allowedTiers = ['pro_service', 'club_license'];
    const userTier = ctx.profile?.subscription_tier || 'free';
    if (!allowedTiers.includes(userTier)) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'This feature requires Pro Service or Club License subscription',
        });
    }
    return next();
});