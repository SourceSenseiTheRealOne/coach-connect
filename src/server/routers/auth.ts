import { router, publicProcedure, protectedProcedure } from '../trpc';
import {
    signupSchema,
    loginSchema,
    resetPasswordSchema,
    updatePasswordSchema,
    oauthSchema,
} from '../../shared/validators';
import { TRPCError } from '@trpc/server';
import { getSupabaseServerClient } from '../../lib/supabase-server';
import { z } from 'zod';

export const authRouter = router({
    // Sign up new user
    signup: publicProcedure
        .input(signupSchema)
        .mutation(async ({ input }) => {
            const { email, password, full_name, username, user_type } = input;
            const supabase = getSupabaseServerClient();

            // Check if username is already taken
            const { data: existingUsername } = await supabase
                .from('profiles')
                .select('username')
                .eq('username', username)
                .single();

            if (existingUsername) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Username is already taken',
                });
            }

            // Create user in Supabase Auth
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name,
                        username,
                        user_type,
                    },
                },
            });

            if (error) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: error.message || 'Failed to create account',
                });
            }

            if (!data.user) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to create user',
                });
            }

            // Create profile in profiles table
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: data.user.id,
                    email,
                    username,
                    full_name,
                    user_type,
                    country: 'Portugal',
                });

            if (profileError) {
                console.error('Error creating profile:', profileError);
                // Don't throw here - the user is created, profile can be created later
            }

            return {
                success: true,
                user: {
                    id: data.user.id,
                    email: data.user.email || email,
                },
                session: data.session ? {
                    access_token: data.session.access_token,
                } : null,
                requiresEmailConfirmation: !data.session,
            };
        }),

    // Sign in user
    login: publicProcedure
        .input(loginSchema)
        .mutation(async ({ input }) => {
            const { email, password } = input;
            const supabase = getSupabaseServerClient();

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Invalid email or password',
                });
            }

            if (!data.user || !data.session) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to sign in',
                });
            }

            return {
                success: true,
                user: {
                    id: data.user.id,
                    email: data.user.email || email,
                },
                session: {
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token,
                    expires_at: data.session.expires_at,
                },
            };
        }),

    // Sign out user
    logout: protectedProcedure
        .mutation(async ({ ctx }) => {
            const supabase = getSupabaseServerClient();

            // Sign out globally (invalidates all sessions)
            const { error } = await supabase.auth.admin.signOut(ctx.user.id, 'global');

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
        .query(async ({ ctx }) => {
            return {
                session: ctx.user ? {
                    user: ctx.user,
                    profile: ctx.profile,
                } : null,
            };
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
            const supabase = getSupabaseServerClient();

            // Get the frontend URL from env or default
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: provider as 'google',
                options: {
                    redirectTo: `${frontendUrl}/auth/callback`,
                },
            });

            if (error) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error.message || 'Failed to initiate OAuth',
                });
            }

            return { url: data.url };
        }),

    // Send password reset email
    resetPassword: publicProcedure
        .input(resetPasswordSchema)
        .mutation(async ({ input }) => {
            const { email } = input;
            const supabase = getSupabaseServerClient();

            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${frontendUrl}/reset-password`,
            });

            if (error) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: error.message || 'Failed to send reset email',
                });
            }

            return { success: true };
        }),

    // Update password
    updatePassword: protectedProcedure
        .input(updatePasswordSchema)
        .mutation(async ({ input, ctx }) => {
            const { password } = input;
            const supabase = getSupabaseServerClient();

            const { error } = await supabase.auth.admin.updateUserById(
                ctx.user.id,
                { password }
            );

            if (error) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error.message || 'Failed to update password',
                });
            }

            return { success: true };
        }),

    // Update password with token (for password reset flow - public)
    updatePasswordWithToken: publicProcedure
        .input(updatePasswordSchema.extend({
            access_token: z.string(),
            refresh_token: z.string(),
        }))
        .mutation(async ({ input }) => {
            const { password, access_token, refresh_token } = input;
            const supabase = getSupabaseServerClient();

            // Set the session using the tokens from the URL
            const { error: sessionError } = await supabase.auth.setSession({
                access_token,
                refresh_token,
            });

            if (sessionError) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Invalid or expired reset link',
                });
            }

            // Update the password
            const { error } = await supabase.auth.updateUser({ password });

            if (error) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error.message || 'Failed to update password',
                });
            }

            return { success: true };
        }),
});
