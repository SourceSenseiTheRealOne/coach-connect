import { router, publicProcedure, protectedProcedure } from '../trpc';
import {
    signupSchema,
    loginSchema,
    resetPasswordSchema,
    updatePasswordSchema,
    oauthSchema,
} from '../../shared/validators';
import { TRPCError } from '@trpc/server';

// Placeholder Supabase auth functions (to be implemented with actual Supabase client)
const supabaseAuth = {
    signUp: async (email: string, password: string, metadata: Record<string, unknown>) => {
        // TODO: Implement with Supabase
        console.log('signUp:', { email, metadata });
        return { user: { id: 'mock-user-id', email }, error: null };
    },
    signIn: async (email: string, password: string) => {
        // TODO: Implement with Supabase
        console.log('signIn:', { email });
        return { user: { id: 'mock-user-id', email }, session: { access_token: 'mock-token' }, error: null };
    },
    signOut: async () => {
        // TODO: Implement with Supabase
        return { error: null };
    },
    getSession: async () => {
        // TODO: Implement with Supabase
        return { session: null, error: null };
    },
    resetPassword: async (email: string) => {
        // TODO: Implement with Supabase
        console.log('resetPassword:', { email });
        return { error: null };
    },
    updatePassword: async (password: string) => {
        // TODO: Implement with Supabase
        console.log('updatePassword');
        return { error: null };
    },
    signInWithOAuth: async (provider: string) => {
        // TODO: Implement with Supabase
        console.log('signInWithOAuth:', { provider });
        return { url: 'https://mock-oauth-url.com', error: null };
    },
};

export const authRouter = router({
    // Sign up new user
    signup: publicProcedure
        .input(signupSchema)
        .mutation(async ({ input }) => {
            const { email, password, full_name, username, user_type } = input;

            const { user, error } = await supabaseAuth.signUp(email, password, {
                full_name,
                username,
                user_type,
            });

            if (error) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: error.message || 'Failed to create account',
                });
            }

            return {
                success: true,
                user: {
                    id: user!.id,
                    email: user!.email,
                },
            };
        }),

    // Sign in user
    login: publicProcedure
        .input(loginSchema)
        .mutation(async ({ input }) => {
            const { email, password } = input;

            const { user, session, error } = await supabaseAuth.signIn(email, password);

            if (error) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Invalid email or password',
                });
            }

            return {
                success: true,
                user: {
                    id: user!.id,
                    email: user!.email,
                },
                session: {
                    access_token: session!.access_token,
                },
            };
        }),

    // Sign out user
    logout: protectedProcedure
        .mutation(async () => {
            const { error } = await supabaseAuth.signOut();

            if (error) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to sign out',
                });
            }

            return { success: true };
        }),

    // Get current session
    getSession: publicProcedure
        .query(async () => {
            const { session, error } = await supabaseAuth.getSession();

            if (error) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to get session',
                });
            }

            return { session };
        }),

    // Get current user with profile
    getUser: protectedProcedure
        .query(async ({ ctx }) => {
            return {
                user: ctx.user,
                profile: ctx.profile,
            };
        }),

    // Initiate OAuth flow
    oauth: publicProcedure
        .input(oauthSchema)
        .mutation(async ({ input }) => {
            const { provider } = input;

            const { url, error } = await supabaseAuth.signInWithOAuth(provider);

            if (error) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to initiate OAuth',
                });
            }

            return { url };
        }),

    // Send password reset email
    resetPassword: publicProcedure
        .input(resetPasswordSchema)
        .mutation(async ({ input }) => {
            const { email } = input;

            const { error } = await supabaseAuth.resetPassword(email);

            if (error) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Failed to send reset email',
                });
            }

            return { success: true };
        }),

    // Update password
    updatePassword: protectedProcedure
        .input(updatePasswordSchema)
        .mutation(async ({ input }) => {
            const { password } = input;

            const { error } = await supabaseAuth.updatePassword(password);

            if (error) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to update password',
                });
            }

            return { success: true };
        }),
});