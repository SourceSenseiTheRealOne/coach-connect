/**
 * Centralized Database Utility Module
 * Provides type-safe Supabase queries for all routers
 */

import { getSupabaseServerClient } from '../../lib/supabase-server';

// Export supabase client for direct use in routers
export const supabase = getSupabaseServerClient();

import type {
    Profile,
    PublicProfileSummary,
    ClubProfile,
    ClubMember,
    ClubStaff,
    Exercise,
    ExerciseWithAuthor,
    ExerciseReview,
    SeasonPlan,
    TrainingSession,
    SessionExercise,
    TacticBoard,
    Post,
    PostWithAuthor,
    PostComment,
    CommentWithAuthor,
    Connection,
    Conversation,
    ConversationParticipant,
    Message,
    JobListing,
    JobApplication,
    ForumCategory,
    ForumThread,
    ForumReply,
    Match,
    MatchRequest,
    MarketplaceListing,
    MarketplaceReview,
    MarketplaceOrder,
    SellerPayoutProfile,
    Notification,
    UserSettings,
    PaginatedResponse,
} from '../../shared/types';

type EmbeddedProfile = PublicProfileSummary | PublicProfileSummary[] | null;

function normalizeEmbeddedProfile(profile: EmbeddedProfile): PublicProfileSummary | null {
    return Array.isArray(profile) ? (profile[0] ?? null) : profile;
}

const profileSummarySelect = 'id, username, full_name, avatar_url, user_type, uefa_license, is_verified, city';
const profileSelect = 'id, username, full_name, avatar_url, cover_image_url, bio, user_type, uefa_license, is_verified, city, district, country, subscription_tier, stripe_customer_id, subscription_expires_at, profile_views, created_at, updated_at';
const exerciseSelect = 'id, author_id, title, description, category, age_group, difficulty, image_url, animation_url, video_url, diagram_data, min_players, max_players, duration_minutes, equipment, is_premium, is_approved, status, likes_count, views_count, created_at, updated_at';
const postSelect = 'id, author_id, content, post_type, media_urls, exercise_id, likes_count, comments_count, shares_count, created_at, updated_at';
const jobListingSelect = 'id, club_id, created_by_id, title, description, job_type, age_group, is_paid, salary_range, location, application_deadline, is_active, applications_count, created_at, updated_at';
const marketplaceListingSelect = 'id, seller_id, title, description, service_type, price_cents, price_type, currency, images, service_area, is_remote, is_active, is_featured, views_count, stripe_price_id, created_at, updated_at';
const sellerPayoutProfileSelect = 'user_id, account_holder_name, payout_method, country, currency, bank_reference, bank_reference_last4, created_at, updated_at';
const marketplaceOrderSelect = 'id, listing_id, buyer_id, seller_id, status, gross_amount_cents, platform_fee_cents, seller_net_cents, currency, stripe_checkout_session_id, stripe_payment_intent_id, paid_at, payout_status, payout_due_at, payout_processed_at, payout_reference, admin_note, created_at, updated_at';
const notificationSelect = 'id, user_id, type, title, body, reference_type, reference_id, actor_id, is_read, created_at';
const userSettingsSelect = 'user_id, new_messages, exercise_likes, new_followers, job_opportunities, platform_updates, language, created_at, updated_at';

export const defaultUserSettings = {
    new_messages: true,
    exercise_likes: true,
    new_followers: true,
    job_opportunities: true,
    platform_updates: false,
    language: 'en',
} as const;

// ============================================================
// PROFILES
// ============================================================

export const profiles = {
    getById: async (id: string): Promise<Profile | null> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('profiles')
            .select(profileSelect)
            .eq('id', id)
            .single();
        if (error) return null;
        return data as Profile;
    },

    getByUsername: async (username: string): Promise<Profile | null> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('profiles')
            .select(profileSelect)
            .eq('username', username)
            .single();
        if (error) return null;
        return data as Profile;
    },

    update: async (id: string, updates: Partial<Profile>): Promise<Profile | null> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('profiles')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) return null;
        return data as Profile;
    },

    incrementViews: async (id: string): Promise<void> => {
        const supabase = getSupabaseServerClient();
        await supabase.rpc('increment_profile_views', { profile_id: id });
    },

    search: async (query: string, limit = 20): Promise<Profile[]> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('profiles')
            .select(profileSelect)
            .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
            .limit(limit);
        if (error) return [];
        return data as Profile[];
    },
};

// ============================================================
// USER SETTINGS
// ============================================================

export const userSettings = {
    getByUser: async (userId: string): Promise<UserSettings | null> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('user_settings')
            .select(userSettingsSelect)
            .eq('user_id', userId)
            .maybeSingle();

        if (error) return null;
        return data as UserSettings | null;
    },

    getOrCreate: async (userId: string): Promise<UserSettings | null> => {
        const existing = await userSettings.getByUser(userId);
        if (existing) return existing;

        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('user_settings')
            .insert({
                user_id: userId,
                ...defaultUserSettings,
            })
            .select(userSettingsSelect)
            .single();

        if (error) return null;
        return data as UserSettings;
    },

    update: async (
        userId: string,
        updates: Partial<Omit<UserSettings, 'user_id' | 'created_at' | 'updated_at'>>,
    ): Promise<UserSettings | null> => {
        const existing = await userSettings.getOrCreate(userId);
        if (!existing) return null;

        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('user_settings')
            .upsert({
                user_id: userId,
                new_messages: existing.new_messages,
                exercise_likes: existing.exercise_likes,
                new_followers: existing.new_followers,
                job_opportunities: existing.job_opportunities,
                platform_updates: existing.platform_updates,
                language: existing.language,
                ...updates,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' })
            .select(userSettingsSelect)
            .single();

        if (error) return null;
        return data as UserSettings;
    },
};

// ============================================================
// CLUBS
// ============================================================

export const clubs = {
    getById: async (id: string): Promise<ClubProfile | null> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('clubs')
            .select('*')
            .eq('id', id)
            .single();
        if (error) return null;
        return data as ClubProfile;
    },

    create: async (data: Partial<ClubProfile>): Promise<ClubProfile | null> => {
        const supabase = getSupabaseServerClient();
        const { data: club, error } = await supabase
            .from('clubs')
            .insert(data)
            .select()
            .single();
        if (error) return null;
        return club as ClubProfile;
    },

    update: async (id: string, updates: Partial<ClubProfile>): Promise<ClubProfile | null> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('clubs')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) return null;
        return data as ClubProfile;
    },

    getMembers: async (clubId: string): Promise<(ClubMember & { profile: Profile })[]> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('club_members')
            .select('*, profile:profiles(*)')
            .eq('club_id', clubId);
        if (error) return [];
        return data as (ClubMember & { profile: Profile })[];
    },

    addMember: async (clubId: string, userId: string, role: string): Promise<ClubMember | null> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('club_members')
            .insert({ club_id: clubId, user_id: userId, role })
            .select()
            .single();
        if (error) return null;
        return data as ClubMember;
    },

    removeMember: async (clubId: string, userId: string): Promise<boolean> => {
        const supabase = getSupabaseServerClient();
        const { error } = await supabase
            .from('club_members')
            .delete()
            .eq('club_id', clubId)
            .eq('user_id', userId);
        return !error;
    },
};

// ============================================================
// EXERCISES
// ============================================================

export const exercises = {
    list: async (params: {
        page: number;
        pageSize: number;
        category?: string;
        age_group?: string;
        difficulty?: string;
        search?: string;
        author_id?: string;
        is_premium?: boolean;
        userId?: string;
    }): Promise<PaginatedResponse<ExerciseWithAuthor>> => {
        const supabase = getSupabaseServerClient();
        const { page, pageSize, category, age_group, difficulty, search, author_id, is_premium, userId } = params;

        let query = supabase
            .from('exercises')
            .select(`
                ${exerciseSelect},
                author:profiles!exercises_author_id_fkey(${profileSummarySelect})
            `, { count: 'exact' });

        if (category) query = query.eq('category', category);
        if (age_group) query = query.eq('age_group', age_group);
        if (difficulty) query = query.eq('difficulty', difficulty);
        if (author_id) query = query.eq('author_id', author_id);
        if (is_premium !== undefined) query = query.eq('is_premium', is_premium);
        if (search) query = query.ilike('title', `%${search}%`);

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) {
            return { items: [], total: 0, page, pageSize, totalPages: 0 };
        }

        const exerciseRows = (data ?? []) as Array<Exercise & { author: EmbeddedProfile }>;
        const exerciseIds = exerciseRows.map((exercise) => exercise.id);
        let likedIds = new Set<string>();

        if (userId && exerciseIds.length) {
            const { data: likes } = await supabase
                .from('exercise_likes')
                .select('exercise_id')
                .eq('user_id', userId)
                .in('exercise_id', exerciseIds);

            likedIds = new Set((likes ?? []).map((like) => like.exercise_id as string));
        }

        return {
            items: exerciseRows.map((exercise) => ({
                ...exercise,
                author: normalizeEmbeddedProfile(exercise.author),
                isLikedByMe: likedIds.has(exercise.id),
            })),
            total: count || 0,
            page,
            pageSize,
            totalPages: Math.ceil((count || 0) / pageSize),
        };
    },

    getById: async (id: string): Promise<Exercise | null> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('exercises')
            .select(exerciseSelect)
            .eq('id', id)
            .single();
        if (error) return null;
        return data as Exercise;
    },

    create: async (data: Partial<Exercise>): Promise<Exercise | null> => {
        const supabase = getSupabaseServerClient();
        const { data: exercise, error } = await supabase
            .from('exercises')
            .insert(data)
            .select()
            .single();
        if (error) return null;
        return exercise as Exercise;
    },

    update: async (id: string, updates: Partial<Exercise>): Promise<Exercise | null> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('exercises')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) return null;
        return data as Exercise;
    },

    delete: async (id: string): Promise<boolean> => {
        const supabase = getSupabaseServerClient();
        const { error } = await supabase
            .from('exercises')
            .delete()
            .eq('id', id);
        return !error;
    },

    incrementViews: async (id: string): Promise<void> => {
        const supabase = getSupabaseServerClient();
        await supabase.rpc('increment_exercise_views', { exercise_id: id });
    },

    getByAuthor: async (authorId: string): Promise<Exercise[]> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('exercises')
            .select(exerciseSelect)
            .eq('author_id', authorId)
            .order('created_at', { ascending: false });
        if (error) return [];
        return data as Exercise[];
    },

    // Likes
    isLiked: async (userId: string, exerciseId: string): Promise<boolean> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('exercise_likes')
            .select('id')
            .eq('user_id', userId)
            .eq('exercise_id', exerciseId)
            .single();
        return !error && !!data;
    },

    like: async (userId: string, exerciseId: string): Promise<boolean> => {
        const supabase = getSupabaseServerClient();
        const { error } = await supabase
            .from('exercise_likes')
            .insert({ user_id: userId, exercise_id: exerciseId });
        if (error) return false;
        // Increment likes count
        await supabase.rpc('increment_exercise_likes', { exercise_id: exerciseId });
        return true;
    },

    unlike: async (userId: string, exerciseId: string): Promise<boolean> => {
        const supabase = getSupabaseServerClient();
        const { error } = await supabase
            .from('exercise_likes')
            .delete()
            .eq('user_id', userId)
            .eq('exercise_id', exerciseId);
        if (error) return false;
        // Decrement likes count
        await supabase.rpc('decrement_exercise_likes', { exercise_id: exerciseId });
        return true;
    },

    // Reviews
    getReviews: async (exerciseId: string): Promise<ExerciseReview[]> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('exercise_reviews')
            .select('*')
            .eq('exercise_id', exerciseId)
            .order('created_at', { ascending: false });
        if (error) return [];
        return data as ExerciseReview[];
    },

    createReview: async (data: Partial<ExerciseReview>): Promise<ExerciseReview | null> => {
        const supabase = getSupabaseServerClient();
        const { data: review, error } = await supabase
            .from('exercise_reviews')
            .insert(data)
            .select()
            .single();
        if (error) return null;
        return review as ExerciseReview;
    },
};

// ============================================================
// POSTS / FEED
// ============================================================

export const posts = {
    list: async (params: {
        page: number;
        pageSize: number;
        author_id?: string;
        post_type?: string;
        userId?: string;
    }): Promise<PaginatedResponse<PostWithAuthor>> => {
        const supabase = getSupabaseServerClient();
        const { page, pageSize, author_id, post_type, userId } = params;

        let query = supabase
            .from('posts')
            .select(`
                ${postSelect},
                author:profiles!posts_author_id_fkey(${profileSummarySelect})
            `, { count: 'exact' });

        if (author_id) query = query.eq('author_id', author_id);
        if (post_type) query = query.eq('post_type', post_type);

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) {
            return { items: [], total: 0, page, pageSize, totalPages: 0 };
        }

        const postRows = (data ?? []) as Array<Post & { author: EmbeddedProfile }>;
        const postIds = postRows.map((post) => post.id);
        let likedIds = new Set<string>();

        if (userId && postIds.length) {
            const { data: likes } = await supabase
                .from('post_likes')
                .select('post_id')
                .eq('user_id', userId)
                .in('post_id', postIds);

            likedIds = new Set((likes ?? []).map((like) => like.post_id as string));
        }

        return {
            items: postRows.map((post) => ({
                ...post,
                author: normalizeEmbeddedProfile(post.author),
                isLikedByMe: likedIds.has(post.id),
            })),
            total: count || 0,
            page,
            pageSize,
            totalPages: Math.ceil((count || 0) / pageSize),
        };
    },

    getById: async (id: string): Promise<Post | null> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('posts')
            .select(postSelect)
            .eq('id', id)
            .single();
        if (error) return null;
        return data as Post;
    },

    create: async (data: Partial<Post>): Promise<Post | null> => {
        const supabase = getSupabaseServerClient();
        const { data: post, error } = await supabase
            .from('posts')
            .insert(data)
            .select()
            .single();
        if (error) return null;
        return post as Post;
    },

    update: async (id: string, updates: Partial<Post>): Promise<Post | null> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('posts')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) return null;
        return data as Post;
    },

    delete: async (id: string): Promise<boolean> => {
        const supabase = getSupabaseServerClient();
        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', id);
        return !error;
    },

    // Comments
    getComments: async (postId: string): Promise<CommentWithAuthor[]> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('post_comments')
            .select(`
                id, post_id, author_id, content, parent_comment_id, created_at,
                author:profiles!post_comments_author_id_fkey(${profileSummarySelect})
            `)
            .eq('post_id', postId)
            .order('created_at', { ascending: true });
        if (error) return [];
        return ((data ?? []) as Array<PostComment & { author: EmbeddedProfile }>).map((comment) => ({
            ...comment,
            author: normalizeEmbeddedProfile(comment.author),
        }));
    },

    createComment: async (data: Partial<PostComment>): Promise<PostComment | null> => {
        const supabase = getSupabaseServerClient();
        // Map parent_id to parent_comment_id for actual DB schema
        const insertData: Record<string, unknown> = { ...data };
        if ('parent_id' in insertData) {
            insertData.parent_comment_id = insertData.parent_id;
            delete insertData.parent_id;
        }
        const { data: comment, error } = await supabase
            .from('post_comments')
            .insert(insertData)
            .select()
            .single();
        if (error) return null;

        // Increment comments count
        if (comment && comment.post_id) {
            await supabase.rpc('increment_post_comments', { post_id: comment.post_id });
        }

        return comment as PostComment;
    },

    // Likes
    isLiked: async (userId: string, postId: string): Promise<boolean> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('post_likes')
            .select('id')
            .eq('user_id', userId)
            .eq('post_id', postId)
            .single();
        return !error && !!data;
    },

    like: async (userId: string, postId: string): Promise<boolean> => {
        const supabase = getSupabaseServerClient();
        const { error } = await supabase
            .from('post_likes')
            .insert({ user_id: userId, post_id: postId });
        if (error) return false;
        await supabase.rpc('increment_post_likes', { post_id: postId });
        return true;
    },

    unlike: async (userId: string, postId: string): Promise<boolean> => {
        const supabase = getSupabaseServerClient();
        const { error } = await supabase
            .from('post_likes')
            .delete()
            .eq('user_id', userId)
            .eq('post_id', postId);
        if (error) return false;
        await supabase.rpc('decrement_post_likes', { post_id: postId });
        return true;
    },
};

// ============================================================
// CONNECTIONS
// ============================================================

export const connections = {
    getFollowers: async (userId: string): Promise<(Connection & { follower: Profile })[]> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('connections')
            .select('*, follower:profiles!connections_follower_id_fkey(*)')
            .eq('following_id', userId);
        if (error) return [];
        return data as (Connection & { follower: Profile })[];
    },

    getFollowing: async (userId: string): Promise<(Connection & { following: Profile })[]> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('connections')
            .select('*, following:profiles!connections_following_id_fkey(*)')
            .eq('follower_id', userId);
        if (error) return [];
        return data as (Connection & { following: Profile })[];
    },

    isFollowing: async (followerId: string, followingId: string): Promise<boolean> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('connections')
            .select('id')
            .eq('follower_id', followerId)
            .eq('following_id', followingId)
            .single();
        return !error && !!data;
    },

    follow: async (followerId: string, followingId: string): Promise<Connection | null> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('connections')
            .insert({ follower_id: followerId, following_id: followingId, status: 'following' })
            .select()
            .single();
        if (error) return null;
        return data as Connection;
    },

    unfollow: async (followerId: string, followingId: string): Promise<boolean> => {
        const supabase = getSupabaseServerClient();
        const { error } = await supabase
            .from('connections')
            .delete()
            .eq('follower_id', followerId)
            .eq('following_id', followingId);
        return !error;
    },

    getFollowCounts: async (userId: string): Promise<{ followers: number; following: number }> => {
        const supabase = getSupabaseServerClient();

        const [followersResult, followingResult] = await Promise.all([
            supabase.from('connections').select('id', { count: 'exact', head: true }).eq('following_id', userId),
            supabase.from('connections').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
        ]);

        return {
            followers: followersResult.count || 0,
            following: followingResult.count || 0,
        };
    },
};

// ============================================================
// MESSAGING
// ============================================================

export const messaging = {
    getConversations: async (userId: string): Promise<(Conversation & { participants: Profile[], last_message?: Message, my_last_read_at: string | null })[]> => {
        const supabase = getSupabaseServerClient();

        // Get conversation IDs where user is a participant
        const { data: participations, error: partError } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', userId);

        if (partError || !participations.length) return [];

        const conversationIds = participations.map(p => p.conversation_id);

        // Get conversations with participants and last message
        const { data: conversations, error: convError } = await supabase
            .from('conversations')
            .select(`
                *,
                conversation_participants (
                    user_id,
                    last_read_at,
                    profile:profiles (*)
                )
            `)
            .in('id', conversationIds)
            .order('updated_at', { ascending: false });

        if (convError) return [];

        // Batch-fetch last messages for all conversations in a single query
        const { data: lastMessages } = await supabase
            .from('messages')
            .select('*, conversation_id')
            .in('conversation_id', conversationIds)
            .order('created_at', { ascending: false });

        // Build a map of conversation_id -> last message
        const lastMessageMap = new Map<string, Message>();
        for (const msg of lastMessages || []) {
            if (!lastMessageMap.has(msg.conversation_id)) {
                lastMessageMap.set(msg.conversation_id, msg as Message);
            }
        }

        const result = (conversations || []).map((conv) => {
            const rawParticipants = conv.conversation_participants as Array<{
                user_id: string;
                last_read_at: string | null;
                profile: Profile;
            }>;
            const participants = rawParticipants
                .map((p) => p.profile)
                .filter(Boolean);
            const myEntry = rawParticipants.find((p) => p.user_id === userId);

            return {
                ...conv,
                participants,
                last_message: lastMessageMap.get(conv.id) || undefined,
                my_last_read_at: myEntry?.last_read_at ?? null,
            } as Conversation & { participants: Profile[], last_message?: Message, my_last_read_at: string | null };
        });

        return result;
    },

    createConversation: async (participantIds: string[]): Promise<Conversation | null> => {
        const supabase = getSupabaseServerClient();

        // Create conversation
        const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .insert({})
            .select()
            .single();

        if (convError) return null;

        // Add participants
        const participants = participantIds.map(userId => ({
            conversation_id: conversation.id,
            user_id: userId,
        }));

        const { error: partError } = await supabase
            .from('conversation_participants')
            .insert(participants);

        if (partError) return null;

        return conversation as Conversation;
    },

    getOrCreateDirectConversation: async (userAId: string, userBId: string): Promise<Conversation | null> => {
        const supabase = getSupabaseServerClient();
        if (userAId === userBId) return null;

        const { data: userAConversations, error: userAError } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', userAId);
        if (userAError) return null;

        const conversationIds = (userAConversations || []).map((row) => row.conversation_id);
        if (conversationIds.length > 0) {
            const { data: existingParticipants } = await supabase
                .from('conversation_participants')
                .select('conversation_id, user_id')
                .in('conversation_id', conversationIds);

            const grouped = new Map<string, Set<string>>();
            for (const participant of existingParticipants || []) {
                const set = grouped.get(participant.conversation_id) ?? new Set<string>();
                set.add(participant.user_id);
                grouped.set(participant.conversation_id, set);
            }

            for (const [conversationId, participantIds] of grouped) {
                if (participantIds.size === 2 && participantIds.has(userAId) && participantIds.has(userBId)) {
                    const { data: conversation, error } = await supabase
                        .from('conversations')
                        .select('*')
                        .eq('id', conversationId)
                        .single();
                    if (!error) return conversation as Conversation;
                }
            }
        }

        return messaging.createConversation([userAId, userBId]);
    },

    getMessages: async (conversationId: string, page = 1, pageSize = 50): Promise<Message[]> => {
        const supabase = getSupabaseServerClient();
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true })
            .range(from, to);

        if (error) return [];
        return data as Message[];
    },

    sendMessage: async (conversationId: string, senderId: string, content: string, mediaUrl?: string): Promise<Message | null> => {
        const supabase = getSupabaseServerClient();

        const { data: message, error } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: senderId,
                content,
                media_url: mediaUrl || null,
            })
            .select()
            .single();

        if (error) return null;

        // Update conversation updated_at
        await supabase
            .from('conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', conversationId);

        return message as Message;
    },

    markAsRead: async (conversationId: string, userId: string): Promise<boolean> => {
        const supabase = getSupabaseServerClient();
        const { error } = await supabase
            .from('conversation_participants')
            .update({ last_read_at: new Date().toISOString() })
            .eq('conversation_id', conversationId)
            .eq('user_id', userId);
        return !error;
    },

    searchUsers: async (query: string, currentUserId: string, limit = 15): Promise<Profile[]> => {
        const supabase = getSupabaseServerClient();
        const trimmed = query.trim();
        if (!trimmed) return [];

        const escaped = trimmed.replace(/[%_,]/g, (c) => `\\${c}`);
        const looksLikeEmail = /@/.test(trimmed);
        const matchedIds = new Set<string>();
        const merged: Profile[] = [];

        // Profile name/username matches
        const { data: profileMatches } = await supabase
            .from('profiles')
            .select(profileSelect)
            .neq('id', currentUserId)
            .or(`username.ilike.%${escaped}%,full_name.ilike.%${escaped}%`)
            .limit(limit);

        for (const row of (profileMatches || []) as Profile[]) {
            if (!matchedIds.has(row.id)) {
                matchedIds.add(row.id);
                merged.push(row);
            }
        }

        // If query looks like email or no name match found, try email search via auth.admin
        if (looksLikeEmail || merged.length < limit) {
            try {
                // listUsers can be paginated; we keep it bounded since it's a service role admin call.
                const { data: usersData } = await supabase.auth.admin.listUsers({
                    page: 1,
                    perPage: 200,
                });
                const lower = trimmed.toLowerCase();
                const emailUserIds: string[] = [];
                for (const u of usersData?.users || []) {
                    if (u.id === currentUserId) continue;
                    if (u.email && u.email.toLowerCase().includes(lower)) {
                        emailUserIds.push(u.id);
                    }
                    if (emailUserIds.length >= limit) break;
                }
                const newIds = emailUserIds.filter((id) => !matchedIds.has(id));
                if (newIds.length > 0) {
                    const { data: emailProfileRows } = await supabase
                        .from('profiles')
                        .select(profileSelect)
                        .in('id', newIds);
                    for (const row of (emailProfileRows || []) as Profile[]) {
                        if (!matchedIds.has(row.id)) {
                            matchedIds.add(row.id);
                            merged.push(row);
                        }
                    }
                }
            } catch {
                // auth.admin not available or failed - fall back to profile-only matches
            }
        }

        return merged.slice(0, limit);
    },

    getUnreadCount: async (userId: string): Promise<number> => {
        const supabase = getSupabaseServerClient();

        const { data: participations } = await supabase
            .from('conversation_participants')
            .select('conversation_id, last_read_at')
            .eq('user_id', userId);

        if (!participations || participations.length === 0) return 0;

        let total = 0;
        // Run counts in parallel to keep this snappy.
        const results = await Promise.all(
            participations.map(async (p) => {
                const lastRead = p.last_read_at || '1970-01-01T00:00:00Z';
                const { count } = await supabase
                    .from('messages')
                    .select('id', { count: 'exact', head: true })
                    .eq('conversation_id', p.conversation_id)
                    .neq('sender_id', userId)
                    .gt('created_at', lastRead);
                return count || 0;
            }),
        );
        for (const c of results) total += c;
        return total;
    },
};

// ============================================================
// PLANNER
// ============================================================

export const planner = {
    // Season Plans
    getSeasonPlans: async (ownerId: string): Promise<SeasonPlan[]> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('season_plans')
            .select('*')
            .eq('owner_id', ownerId)
            .order('created_at', { ascending: false });
        if (error) return [];
        return data as SeasonPlan[];
    },

    getSeasonPlanById: async (id: string): Promise<SeasonPlan | null> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('season_plans')
            .select('*')
            .eq('id', id)
            .single();
        if (error) return null;
        return data as SeasonPlan;
    },

    createSeasonPlan: async (data: Partial<SeasonPlan>): Promise<SeasonPlan | null> => {
        const supabase = getSupabaseServerClient();
        const { data: plan, error } = await supabase
            .from('season_plans')
            .insert(data)
            .select()
            .single();
        if (error) return null;
        return plan as SeasonPlan;
    },

    updateSeasonPlan: async (id: string, updates: Partial<SeasonPlan>): Promise<SeasonPlan | null> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('season_plans')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) return null;
        return data as SeasonPlan;
    },

    deleteSeasonPlan: async (id: string): Promise<boolean> => {
        const supabase = getSupabaseServerClient();
        const { error } = await supabase
            .from('season_plans')
            .delete()
            .eq('id', id);
        return !error;
    },

    // Training Sessions
    getTrainingSessions: async (planId: string): Promise<TrainingSession[]> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('training_sessions')
            .select('*')
            .eq('plan_id', planId)
            .order('scheduled_date', { ascending: true });
        if (error) return [];
        return data as TrainingSession[];
    },

    createTrainingSession: async (data: Partial<TrainingSession>): Promise<TrainingSession | null> => {
        const supabase = getSupabaseServerClient();
        const { data: session, error } = await supabase
            .from('training_sessions')
            .insert(data)
            .select()
            .single();
        if (error) return null;
        return session as TrainingSession;
    },

    updateTrainingSession: async (id: string, updates: Partial<TrainingSession>): Promise<TrainingSession | null> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('training_sessions')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) return null;
        return data as TrainingSession;
    },

    deleteTrainingSession: async (id: string): Promise<boolean> => {
        const supabase = getSupabaseServerClient();
        const { error } = await supabase
            .from('training_sessions')
            .delete()
            .eq('id', id);
        return !error;
    },

    // Session Exercises
    getSessionExercises: async (sessionId: string): Promise<(SessionExercise & { exercise: Exercise })[]> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('session_exercises')
            .select('*, exercise:exercises(*)')
            .eq('session_id', sessionId)
            .order('sort_order', { ascending: true });
        if (error) return [];
        return data as (SessionExercise & { exercise: Exercise })[];
    },

    addExerciseToSession: async (data: Partial<SessionExercise>): Promise<SessionExercise | null> => {
        const supabase = getSupabaseServerClient();
        const { data: sessionExercise, error } = await supabase
            .from('session_exercises')
            .insert(data)
            .select()
            .single();
        if (error) return null;
        return sessionExercise as SessionExercise;
    },

    removeExerciseFromSession: async (id: string): Promise<boolean> => {
        const supabase = getSupabaseServerClient();
        const { error } = await supabase
            .from('session_exercises')
            .delete()
            .eq('id', id);
        return !error;
    },
};

// ============================================================
// TACTIC BOARDS
// ============================================================

export const tacticBoards = {
    getByOwner: async (ownerId: string): Promise<TacticBoard[]> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('tactic_boards')
            .select('*')
            .eq('owner_id', ownerId)
            .order('updated_at', { ascending: false });
        if (error) return [];
        return data as TacticBoard[];
    },

    getById: async (id: string): Promise<TacticBoard | null> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('tactic_boards')
            .select('*')
            .eq('id', id)
            .single();
        if (error) return null;
        return data as TacticBoard;
    },

    create: async (data: Partial<TacticBoard>): Promise<TacticBoard | null> => {
        const supabase = getSupabaseServerClient();
        const { data: board, error } = await supabase
            .from('tactic_boards')
            .insert(data)
            .select()
            .single();
        if (error) return null;
        return board as TacticBoard;
    },

    update: async (id: string, updates: Partial<TacticBoard>): Promise<TacticBoard | null> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('tactic_boards')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) return null;
        return data as TacticBoard;
    },

    duplicate: async (id: string, ownerId: string): Promise<TacticBoard | null> => {
        const supabase = getSupabaseServerClient();

        // Get the original board
        const original = await tacticBoards.getById(id);
        if (!original) return null;

        // Create a duplicate with a modified title
        const { data: board, error } = await supabase
            .from('tactic_boards')
            .insert({
                owner_id: ownerId,
                title: `${original.title} (Copy)`,
                board_data: original.board_data,
                thumbnail_url: original.thumbnail_url,
                animation_data: original.animation_data,
            })
            .select()
            .single();

        if (error) return null;
        return board as TacticBoard;
    },

    delete: async (id: string): Promise<boolean> => {
        const supabase = getSupabaseServerClient();
        const { error } = await supabase
            .from('tactic_boards')
            .delete()
            .eq('id', id);
        return !error;
    },
};

// ============================================================
// JOBS
// ============================================================

export const jobs = {
    list: async (params: {
        page: number;
        pageSize: number;
        job_type?: string;
        age_group?: string;
        location?: string;
        is_active?: boolean;
    }): Promise<PaginatedResponse<JobListing>> => {
        const supabase = getSupabaseServerClient();
        const { page, pageSize, job_type, age_group, location, is_active } = params;

        let query = supabase
            .from('job_listings')
            .select(jobListingSelect, { count: 'exact' });

        if (job_type) query = query.eq('job_type', job_type);
        if (age_group) query = query.eq('age_group', age_group);
        if (location) query = query.ilike('location', `%${location}%`);
        if (is_active !== undefined) query = query.eq('is_active', is_active);

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) {
            return { items: [], total: 0, page, pageSize, totalPages: 0 };
        }

        return {
            items: data as JobListing[],
            total: count || 0,
            page,
            pageSize,
            totalPages: Math.ceil((count || 0) / pageSize),
        };
    },

    getById: async (id: string): Promise<JobListing | null> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('job_listings')
            .select('*')
            .eq('id', id)
            .single();
        if (error) return null;
        return data as JobListing;
    },

    create: async (data: Partial<JobListing>): Promise<JobListing | null> => {
        const supabase = getSupabaseServerClient();
        const { data: job, error } = await supabase
            .from('job_listings')
            .insert(data)
            .select()
            .single();
        if (error) return null;
        return job as JobListing;
    },

    update: async (id: string, updates: Partial<JobListing>): Promise<JobListing | null> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('job_listings')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) return null;
        return data as JobListing;
    },

    delete: async (id: string): Promise<boolean> => {
        const supabase = getSupabaseServerClient();
        const { error } = await supabase
            .from('job_listings')
            .delete()
            .eq('id', id);
        return !error;
    },

    // Applications
    getApplications: async (listingId: string): Promise<JobApplication[]> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('job_applications')
            .select('*')
            .eq('listing_id', listingId)
            .order('created_at', { ascending: false });
        if (error) return [];
        return data as JobApplication[];
    },

    getApplicationByUser: async (listingId: string, applicantId: string): Promise<JobApplication | null> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('job_applications')
            .select('*')
            .eq('listing_id', listingId)
            .eq('applicant_id', applicantId)
            .single();
        if (error) return null;
        return data as JobApplication;
    },

    getApplicationById: async (id: string): Promise<JobApplication | null> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('job_applications')
            .select('*')
            .eq('id', id)
            .single();
        if (error) return null;
        return data as JobApplication;
    },

    apply: async (data: Partial<JobApplication>): Promise<JobApplication | null> => {
        const supabase = getSupabaseServerClient();
        const { data: application, error } = await supabase
            .from('job_applications')
            .insert(data)
            .select()
            .single();
        if (error) return null;
        return application as JobApplication;
    },

    updateApplicationStatus: async (id: string, status: string): Promise<JobApplication | null> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('job_applications')
            .update({ status })
            .eq('id', id)
            .select()
            .single();
        if (error) return null;
        return data as JobApplication;
    },
};

// ============================================================
// FORUM
// ============================================================

export const forum = {
    getCategories: async (): Promise<ForumCategory[]> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('forum_categories')
            .select('*')
            .order('sort_order', { ascending: true });
        if (error) return [];
        return data as ForumCategory[];
    },

    createCategory: async (data: Partial<ForumCategory>): Promise<ForumCategory | null> => {
        const supabase = getSupabaseServerClient();
        const { data: row, error } = await supabase
            .from('forum_categories')
            .insert(data)
            .select()
            .single();
        if (error) return null;
        return row as ForumCategory;
    },

    getThreads: async (params: {
        page: number;
        pageSize: number;
        category_id?: string;
    }): Promise<PaginatedResponse<ForumThread>> => {
        const supabase = getSupabaseServerClient();
        const { page, pageSize, category_id } = params;

        let query = supabase
            .from('forum_threads')
            .select('*', { count: 'exact' });

        if (category_id) query = query.eq('category_id', category_id);

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await query
            .order('is_pinned', { ascending: false })
            .order('last_reply_at', { ascending: false, nullsFirst: false })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) {
            return { items: [], total: 0, page, pageSize, totalPages: 0 };
        }

        return {
            items: data as ForumThread[],
            total: count || 0,
            page,
            pageSize,
            totalPages: Math.ceil((count || 0) / pageSize),
        };
    },

    getThreadById: async (id: string): Promise<ForumThread | null> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('forum_threads')
            .select('*')
            .eq('id', id)
            .single();
        if (error) return null;
        return data as ForumThread;
    },

    createThread: async (data: Partial<ForumThread>): Promise<ForumThread | null> => {
        const supabase = getSupabaseServerClient();
        const { data: thread, error } = await supabase
            .from('forum_threads')
            .insert(data)
            .select()
            .single();
        if (error) return null;
        return thread as ForumThread;
    },

    updateThread: async (id: string, updates: Partial<ForumThread>): Promise<ForumThread | null> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('forum_threads')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) return null;
        return data as ForumThread;
    },

    getReplies: async (threadId: string): Promise<ForumReply[]> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('forum_replies')
            .select('*')
            .eq('thread_id', threadId)
            .order('created_at', { ascending: true });
        if (error) return [];
        return data as ForumReply[];
    },

    createReply: async (data: Partial<ForumReply>): Promise<ForumReply | null> => {
        const supabase = getSupabaseServerClient();
        const { data: reply, error } = await supabase
            .from('forum_replies')
            .insert(data)
            .select()
            .single();
        if (error) return null;
        return reply as ForumReply;
    },
};

// ============================================================
// MATCHES
// ============================================================

export const matches = {
    list: async (params: {
        page: number;
        pageSize: number;
        age_group?: string;
        district?: string;
        match_type?: string;
        from_date?: string;
        to_date?: string;
        is_public?: boolean;
    }): Promise<PaginatedResponse<Match>> => {
        const supabase = getSupabaseServerClient();
        const { page, pageSize, age_group, district, match_type, from_date, to_date, is_public } = params;

        let query = supabase
            .from('matches')
            .select('*', { count: 'exact' });

        if (age_group) query = query.eq('age_group', age_group);
        if (district) query = query.eq('district', district);
        if (match_type) query = query.eq('match_type', match_type);
        if (from_date) query = query.gte('match_date', from_date);
        if (to_date) query = query.lte('match_date', to_date);
        if (is_public !== undefined) query = query.eq('is_public', is_public);

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await query
            .order('match_date', { ascending: true })
            .range(from, to);

        if (error) {
            return { items: [], total: 0, page, pageSize, totalPages: 0 };
        }

        return {
            items: data as Match[],
            total: count || 0,
            page,
            pageSize,
            totalPages: Math.ceil((count || 0) / pageSize),
        };
    },

    getById: async (id: string): Promise<Match | null> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('matches')
            .select('*')
            .eq('id', id)
            .single();
        if (error) return null;
        return data as Match;
    },

    create: async (data: Partial<Match>): Promise<Match | null> => {
        const supabase = getSupabaseServerClient();
        const { data: match, error } = await supabase
            .from('matches')
            .insert(data)
            .select()
            .single();
        if (error) return null;
        return match as Match;
    },

    update: async (id: string, updates: Partial<Match>): Promise<Match | null> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('matches')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) return null;
        return data as Match;
    },

    delete: async (id: string): Promise<boolean> => {
        const supabase = getSupabaseServerClient();
        const { error } = await supabase
            .from('matches')
            .delete()
            .eq('id', id);
        return !error;
    },
};

// ============================================================
// MATCH REQUESTS (Match Maker)
// ============================================================

export const matchRequests = {
    list: async (params: {
        page: number;
        pageSize: number;
        district?: string;
        age_group?: string;
        status?: string;
    }): Promise<PaginatedResponse<MatchRequest>> => {
        const supabase = getSupabaseServerClient();
        const { page, pageSize, district, age_group, status } = params;

        let query = supabase
            .from('match_requests')
            .select('*', { count: 'exact' });

        if (district) query = query.eq('district', district);
        if (age_group) query = query.eq('age_group', age_group);
        if (status) query = query.eq('status', status);

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) {
            return { items: [], total: 0, page, pageSize, totalPages: 0 };
        }

        return {
            items: data as MatchRequest[],
            total: count || 0,
            page,
            pageSize,
            totalPages: Math.ceil((count || 0) / pageSize),
        };
    },

    getById: async (id: string): Promise<MatchRequest | null> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('match_requests')
            .select('*')
            .eq('id', id)
            .single();
        if (error) return null;
        return data as MatchRequest;
    },

    create: async (data: Partial<MatchRequest>): Promise<MatchRequest | null> => {
        const supabase = getSupabaseServerClient();
        const { data: request, error } = await supabase
            .from('match_requests')
            .insert(data)
            .select()
            .single();
        if (error) return null;
        return request as MatchRequest;
    },

    accept: async (requestId: string, acceptedBy: string, resultingMatchId: string): Promise<MatchRequest | null> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('match_requests')
            .update({
                status: 'accepted',
                accepted_by: acceptedBy,
                resulting_match_id: resultingMatchId,
            })
            .eq('id', requestId)
            .select()
            .single();
        if (error) return null;
        return data as MatchRequest;
    },

    cancel: async (id: string): Promise<boolean> => {
        const supabase = getSupabaseServerClient();
        const { error } = await supabase
            .from('match_requests')
            .update({ status: 'cancelled' })
            .eq('id', id);
        return !error;
    },
};

// ============================================================
// MARKETPLACE
// ============================================================

export const sellerPayoutProfiles = {
    getByUser: async (userId: string): Promise<SellerPayoutProfile | null> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('seller_payout_profiles')
            .select(sellerPayoutProfileSelect)
            .eq('user_id', userId)
            .maybeSingle();
        if (error) return null;
        return data as SellerPayoutProfile | null;
    },

    upsert: async (
        userId: string,
        data: Omit<SellerPayoutProfile, 'user_id' | 'bank_reference_last4' | 'created_at' | 'updated_at'>,
    ): Promise<SellerPayoutProfile | null> => {
        const supabase = getSupabaseServerClient();
        const cleanReference = data.bank_reference.replace(/\s+/g, '').toUpperCase();
        const { data: profile, error } = await supabase
            .from('seller_payout_profiles')
            .upsert({
                ...data,
                user_id: userId,
                bank_reference: cleanReference,
                bank_reference_last4: cleanReference.slice(-4),
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' })
            .select(sellerPayoutProfileSelect)
            .single();
        if (error) return null;
        return profile as SellerPayoutProfile;
    },

    listForAdmin: async (): Promise<SellerPayoutProfile[]> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('seller_payout_profiles')
            .select(sellerPayoutProfileSelect)
            .order('updated_at', { ascending: false });
        if (error) return [];
        return data as SellerPayoutProfile[];
    },
};

export const marketplace = {
    list: async (params: {
        page: number;
        pageSize: number;
        service_type?: string;
        service_area?: string;
        is_remote?: boolean;
        search?: string;
    }): Promise<PaginatedResponse<MarketplaceListing>> => {
        const supabase = getSupabaseServerClient();
        const { page, pageSize, service_type, service_area, is_remote, search } = params;

        let query = supabase
            .from('marketplace_listings')
            .select(marketplaceListingSelect, { count: 'exact' })
            .eq('is_active', true);

        if (service_type) query = query.eq('service_type', service_type);
        if (service_area) query = query.ilike('service_area', `%${service_area}%`);
        if (is_remote !== undefined) query = query.eq('is_remote', is_remote);
        if (search) {
            const sanitizedSearch = search.replace(/[%_]/g, '\\$&');
            query = query.or(`title.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%`);
        }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await query
            .order('is_featured', { ascending: false })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) {
            return { items: [], total: 0, page, pageSize, totalPages: 0 };
        }

        return {
            items: data as MarketplaceListing[],
            total: count || 0,
            page,
            pageSize,
            totalPages: Math.ceil((count || 0) / pageSize),
        };
    },

    getById: async (id: string): Promise<MarketplaceListing | null> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('marketplace_listings')
            .select('*')
            .eq('id', id)
            .single();
        if (error) return null;
        return data as MarketplaceListing;
    },

    getBySeller: async (sellerId: string): Promise<MarketplaceListing[]> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('marketplace_listings')
            .select('*')
            .eq('seller_id', sellerId)
            .order('created_at', { ascending: false });
        if (error) return [];
        return data as MarketplaceListing[];
    },

    getReviewByReviewer: async (listingId: string, reviewerId: string): Promise<MarketplaceReview | null> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('marketplace_reviews')
            .select('*')
            .eq('listing_id', listingId)
            .eq('reviewer_id', reviewerId)
            .maybeSingle();
        if (error) return null;
        return data as MarketplaceReview | null;
    },

    create: async (data: Partial<MarketplaceListing>): Promise<MarketplaceListing | null> => {
        const supabase = getSupabaseServerClient();
        const { data: listing, error } = await supabase
            .from('marketplace_listings')
            .insert(data)
            .select()
            .single();
        if (error) return null;
        return listing as MarketplaceListing;
    },

    update: async (id: string, updates: Partial<MarketplaceListing>): Promise<MarketplaceListing | null> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('marketplace_listings')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) return null;
        return data as MarketplaceListing;
    },

    delete: async (id: string): Promise<boolean> => {
        const supabase = getSupabaseServerClient();
        const { error } = await supabase
            .from('marketplace_listings')
            .delete()
            .eq('id', id);
        return !error;
    },

    // Reviews
    getReviews: async (listingId: string): Promise<MarketplaceReview[]> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('marketplace_reviews')
            .select('*')
            .eq('listing_id', listingId)
            .order('created_at', { ascending: false });
        if (error) return [];
        return data as MarketplaceReview[];
    },

    createReview: async (data: Partial<MarketplaceReview>): Promise<MarketplaceReview | null> => {
        const supabase = getSupabaseServerClient();
        const { data: review, error } = await supabase
            .from('marketplace_reviews')
            .insert(data)
            .select()
            .single();
        if (error) return null;
        return review as MarketplaceReview;
    },
};

export const marketplaceOrders = {
    create: async (
        data: Pick<MarketplaceOrder, 'listing_id' | 'buyer_id' | 'seller_id' | 'gross_amount_cents' | 'platform_fee_cents' | 'seller_net_cents' | 'currency'>,
    ): Promise<MarketplaceOrder | null> => {
        const supabase = getSupabaseServerClient();
        const { data: order, error } = await supabase
            .from('marketplace_orders')
            .insert(data)
            .select(marketplaceOrderSelect)
            .single();
        if (error) return null;
        return order as MarketplaceOrder;
    },

    update: async (id: string, updates: Partial<MarketplaceOrder>): Promise<MarketplaceOrder | null> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('marketplace_orders')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select(marketplaceOrderSelect)
            .single();
        if (error) return null;
        return data as MarketplaceOrder;
    },

    getByCheckoutSession: async (sessionId: string): Promise<MarketplaceOrder | null> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('marketplace_orders')
            .select(marketplaceOrderSelect)
            .eq('stripe_checkout_session_id', sessionId)
            .maybeSingle();
        if (error) return null;
        return data as MarketplaceOrder | null;
    },

    getByBuyer: async (buyerId: string): Promise<MarketplaceOrder[]> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('marketplace_orders')
            .select(marketplaceOrderSelect)
            .eq('buyer_id', buyerId)
            .order('created_at', { ascending: false });
        if (error) return [];
        return data as MarketplaceOrder[];
    },

    getBySeller: async (sellerId: string): Promise<MarketplaceOrder[]> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('marketplace_orders')
            .select(marketplaceOrderSelect)
            .eq('seller_id', sellerId)
            .order('created_at', { ascending: false });
        if (error) return [];
        return data as MarketplaceOrder[];
    },

    listForAdmin: async (): Promise<MarketplaceOrder[]> => {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
            .from('marketplace_orders')
            .select(marketplaceOrderSelect)
            .order('created_at', { ascending: false })
            .limit(200);
        if (error) return [];
        return data as MarketplaceOrder[];
    },
};

// ============================================================
// NOTIFICATIONS
// ============================================================

export const notifications = {
    getByUser: async (userId: string, unreadOnly = false): Promise<Notification[]> => {
        const supabase = getSupabaseServerClient();
        let query = supabase
            .from('notifications')
            .select(notificationSelect)
            .eq('user_id', userId);

        if (unreadOnly) query = query.eq('is_read', false);

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) return [];
        return data as Notification[];
    },

    getUnreadCount: async (userId: string): Promise<number> => {
        const supabase = getSupabaseServerClient();
        const { count, error } = await supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);
        if (error) return 0;
        return count || 0;
    },

    markAsRead: async (id: string): Promise<boolean> => {
        const supabase = getSupabaseServerClient();
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);
        return !error;
    },

    markAllAsRead: async (userId: string): Promise<boolean> => {
        const supabase = getSupabaseServerClient();
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);
        return !error;
    },

    create: async (data: Partial<Notification>): Promise<Notification | null> => {
        const supabase = getSupabaseServerClient();
        const { data: notification, error } = await supabase
            .from('notifications')
            .insert(data)
            .select()
            .single();
        if (error) return null;
        return notification as Notification;
    },
};

// ============================================================
// STORAGE / UPLOAD
// ============================================================

export const storage = {
    createUploadUrl: async (bucket: string, filename: string, userId: string): Promise<{ uploadUrl: string; fileUrl: string } | null> => {
        const supabase = getSupabaseServerClient();
        const filePath = `${userId}/${Date.now()}-${filename}`;

        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUploadUrl(filePath);

        if (error) return null;

        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return {
            uploadUrl: data.signedUrl,
            fileUrl: urlData.publicUrl,
        };
    },

    getPublicUrl: (bucket: string, path: string): string => {
        const supabase = getSupabaseServerClient();
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        return data.publicUrl;
    },

    deleteFile: async (bucket: string, path: string): Promise<boolean> => {
        const supabase = getSupabaseServerClient();
        const { error } = await supabase.storage.from(bucket).remove([path]);
        return !error;
    },
};
