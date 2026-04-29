import { z } from 'zod';

// ============================================================
// COMMON SCHEMAS
// ============================================================

export const uuidSchema = z.string().uuid();
export const paginationSchema = z.object({
    page: z.number().int().positive().default(1),
    pageSize: z.number().int().positive().max(100).default(20),
});

// ============================================================
// AUTH SCHEMAS
// ============================================================

export const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    full_name: z.string().min(2).max(100),
    username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
    user_type: z.enum(['coach', 'club', 'scout', 'trainer']),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export const resetPasswordSchema = z.object({
    email: z.string().email(),
});

export const updatePasswordSchema = z.object({
    password: z.string().min(8),
});

export const oauthSchema = z.object({
    provider: z.enum(['google']),
});

// ============================================================
// PROFILE SCHEMAS
// ============================================================

export const userTypeSchema = z.enum(['coach', 'club', 'scout', 'trainer', 'admin']);
export const uefaLicenseSchema = z.enum(['C', 'B', 'A', 'PRO']);
export const subscriptionTierSchema = z.enum(['free', 'premium_coach', 'pro_service', 'club_license']);

export const updateProfileSchema = z.object({
    username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
    full_name: z.string().min(2).max(100).optional(),
    avatar_url: z.string().url().nullable().optional(),
    cover_image_url: z.string().url().nullable().optional(),
    bio: z.string().max(500).nullable().optional(),
    uefa_license: uefaLicenseSchema.nullable().optional(),
    city: z.string().max(100).nullable().optional(),
    district: z.string().max(100).nullable().optional(),
    country: z.string().max(100).optional(),
});

export const createClubProfileSchema = z.object({
    club_name: z.string().min(2).max(200),
    founded_year: z.number().int().min(1800).max(new Date().getFullYear()).nullable(),
    logo_url: z.string().url().nullable(),
    website_url: z.string().url().nullable(),
    webshop_url: z.string().url().nullable(),
});

export const updateClubProfileSchema = createClubProfileSchema.partial();

export const addClubMemberSchema = z.object({
    user_id: uuidSchema,
    role: z.enum(['admin', 'coach', 'staff']),
});

// ============================================================
// EXERCISE SCHEMAS
// ============================================================

export const exerciseCategorySchema = z.enum([
    'warmup', 'passing', 'shooting', 'dribbling', 'defending',
    'goalkeeping', 'tactical', 'physical', 'cooldown', 'rondo',
    'small_sided_game', 'set_piece',
]);

export const ageGroupSchema = z.enum([
    'U7', 'U8', 'U9', 'U10', 'U11', 'U12', 'U13',
    'U14', 'U15', 'U16', 'U17', 'U18', 'U19', 'senior',
]);

export const difficultySchema = z.enum(['beginner', 'intermediate', 'advanced']);

export const listExercisesSchema = paginationSchema.extend({
    category: exerciseCategorySchema.optional(),
    age_group: ageGroupSchema.optional(),
    difficulty: difficultySchema.optional(),
    search: z.string().max(100).optional(),
    author_id: uuidSchema.optional(),
    is_premium: z.boolean().optional(),
});

export const createExerciseSchema = z.object({
    title: z.string().min(3).max(200),
    description: z.string().max(2000).nullable(),
    category: exerciseCategorySchema,
    age_group: ageGroupSchema,
    difficulty: difficultySchema.nullable(),
    image_url: z.string().url().nullable(),
    animation_url: z.string().url().nullable(),
    video_url: z.string().url().nullable(),
    diagram_data: z.record(z.unknown()).nullable(),
    min_players: z.number().int().positive().nullable(),
    max_players: z.number().int().positive().nullable(),
    duration_minutes: z.number().int().positive().nullable(),
    equipment: z.array(z.string()).nullable(),
    is_premium: z.boolean().default(false),
});

export const updateExerciseSchema = createExerciseSchema.partial();

export const createExerciseReviewSchema = z.object({
    exercise_id: uuidSchema,
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(1000).nullable(),
});

// ============================================================
// PLANNER SCHEMAS
// ============================================================

export const planTypeSchema = z.enum(['2_week', 'month', '3_month', 'full_season']);

export const createSeasonPlanSchema = z.object({
    title: z.string().min(3).max(200),
    age_group: ageGroupSchema,
    season_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    season_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    plan_type: planTypeSchema,
    club_id: uuidSchema.nullable(),
});

export const updateSeasonPlanSchema = createSeasonPlanSchema.partial();

export const createTrainingSessionSchema = z.object({
    plan_id: uuidSchema,
    title: z.string().max(200).nullable(),
    scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    start_time: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
    end_time: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
    notes: z.string().max(2000).nullable(),
});

export const updateTrainingSessionSchema = createTrainingSessionSchema.partial().omit({ plan_id: true });

export const addExerciseToSessionSchema = z.object({
    session_id: uuidSchema,
    exercise_id: uuidSchema,
    sort_order: z.number().int().default(0),
    duration_minutes: z.number().int().positive().nullable(),
    notes: z.string().max(500).nullable(),
});

// ============================================================
// TACTIC BOARD SCHEMAS
// ============================================================

export const createTacticBoardSchema = z.object({
    title: z.string().min(3).max(200),
    board_data: z.record(z.unknown()),
    animation_data: z.record(z.unknown()).nullable(),
    thumbnail_url: z.string().url().nullable(),
});

export const updateTacticBoardSchema = createTacticBoardSchema.partial();

// ============================================================
// POST / FEED SCHEMAS
// ============================================================

export const postTypeSchema = z.enum(['general', 'match_report', 'tactical_insight', 'drill_share', 'job_share']);

export const mediaUrlSchema = z.object({
    url: z.string().url(),
    type: z.string(),
    caption: z.string().max(200).optional(),
});

export const createPostSchema = z.object({
    content: z.string().min(1).max(5000),
    post_type: postTypeSchema.default('general'),
    media_urls: z.array(mediaUrlSchema).max(10).optional(),
    exercise_id: uuidSchema.nullable(),
});

export const updatePostSchema = createPostSchema.partial();

export const createCommentSchema = z.object({
    post_id: uuidSchema,
    content: z.string().min(1).max(2000),
    parent_comment_id: uuidSchema.nullable().optional(),
});

export const listPostsSchema = paginationSchema.extend({
    author_id: uuidSchema.optional(),
    post_type: postTypeSchema.optional(),
});

// ============================================================
// CONNECTION SCHEMAS
// ============================================================

export const toggleFollowSchema = z.object({
    target_user_id: uuidSchema,
});

export const listConnectionsSchema = paginationSchema.extend({
    user_id: uuidSchema,
    type: z.enum(['followers', 'following']),
});

// ============================================================
// MESSAGING SCHEMAS
// ============================================================

export const createConversationSchema = z.object({
    participant_ids: z.array(uuidSchema).min(1).max(10),
});

export const sendMessageSchema = z.object({
    conversation_id: uuidSchema,
    content: z.string().min(1).max(5000),
    media_url: z.string().url().nullable(),
});

export const listMessagesSchema = paginationSchema.extend({
    conversation_id: uuidSchema,
});

export const markAsReadSchema = z.object({
    conversation_id: uuidSchema,
});

// ============================================================
// JOB SCHEMAS
// ============================================================

export const jobTypeSchema = z.enum([
    'head_coach', 'assistant_coach', 'goalkeeper_coach',
    'scout', 'video_analyst', 'physio', 'fitness_coach',
    'director', 'other',
]);

export const applicationStatusSchema = z.enum(['pending', 'reviewed', 'accepted', 'rejected']);

export const listJobsSchema = paginationSchema.extend({
    job_type: jobTypeSchema.optional(),
    age_group: ageGroupSchema.optional(),
    location: z.string().max(100).optional(),
    is_active: z.boolean().optional(),
});

export const createJobListingSchema = z.object({
    title: z.string().min(3).max(200),
    description: z.string().min(10).max(10000),
    job_type: jobTypeSchema,
    age_group: ageGroupSchema.nullable(),
    is_paid: z.boolean().default(true),
    salary_range: z.string().max(100).nullable(),
    location: z.string().max(200).nullable(),
    application_deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});

export const updateJobListingSchema = createJobListingSchema.partial();

export const applyToJobSchema = z.object({
    listing_id: uuidSchema,
    cover_letter: z.string().max(5000).nullable(),
    cv_url: z.string().url().nullable(),
});

export const updateApplicationStatusSchema = z.object({
    application_id: uuidSchema,
    status: applicationStatusSchema,
});

// ============================================================
// FORUM SCHEMAS
// ============================================================

export const createForumThreadSchema = z.object({
    category_id: uuidSchema,
    title: z.string().min(3).max(200),
    content: z.string().min(10).max(10000),
});

export const createForumReplySchema = z.object({
    thread_id: uuidSchema,
    content: z.string().min(1).max(5000),
});

export const listThreadsSchema = paginationSchema.extend({
    category_id: uuidSchema.optional(),
});

export const moderateThreadSchema = z.object({
    thread_id: uuidSchema,
    is_pinned: z.boolean().optional(),
    is_locked: z.boolean().optional(),
});

// ============================================================
// MATCH SCHEMAS
// ============================================================

export const matchTypeSchema = z.enum(['competition', 'friendly', 'tournament', 'cup']);
export const matchStatusSchema = z.enum(['scheduled', 'completed', 'cancelled']);

export const listMatchesSchema = paginationSchema.extend({
    age_group: ageGroupSchema.optional(),
    district: z.string().max(100).optional(),
    match_type: matchTypeSchema.optional(),
    from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    is_public: z.boolean().optional(),
});

export const createMatchSchema = z.object({
    club_id: uuidSchema.nullable(),
    home_team: z.string().min(2).max(200),
    away_team: z.string().max(200).nullable(),
    match_type: matchTypeSchema,
    age_group: ageGroupSchema,
    match_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    kick_off_time: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
    venue: z.string().max(200).nullable(),
    city: z.string().max(100).nullable(),
    district: z.string().max(100).nullable(),
    is_public: z.boolean().default(true),
});

export const updateMatchSchema = createMatchSchema.partial();

export const updateMatchResultSchema = z.object({
    match_id: uuidSchema,
    home_score: z.number().int().min(0),
    away_score: z.number().int().min(0),
});

// ============================================================
// MATCH MAKER SCHEMAS
// ============================================================

export const matchRequestStatusSchema = z.enum(['open', 'accepted', 'expired', 'cancelled']);

export const createMatchRequestSchema = z.object({
    team_name: z.string().min(2).max(200),
    age_group: ageGroupSchema,
    preferred_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    preferred_time: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
    location_preference: z.string().max(200).nullable(),
    district: z.string().max(100).nullable(),
    message: z.string().max(1000).nullable(),
});

export const listMatchRequestsSchema = paginationSchema.extend({
    district: z.string().max(100).optional(),
    age_group: ageGroupSchema.optional(),
    status: matchRequestStatusSchema.optional(),
});

export const acceptMatchRequestSchema = z.object({
    request_id: uuidSchema,
});

// ============================================================
// MARKETPLACE SCHEMAS
// ============================================================

export const serviceTypeSchema = z.enum([
    'private_training', 'video_analysis', 'consulting',
    'scouting', 'event_organizing', 'equipment', 'other',
]);

export const priceTypeSchema = z.enum(['fixed', 'hourly', 'per_session', 'contact']);

export const listMarketplaceSchema = paginationSchema.extend({
    service_type: serviceTypeSchema.optional(),
    service_area: z.string().max(100).optional(),
    is_remote: z.boolean().optional(),
    search: z.string().max(100).optional(),
});

export const createMarketplaceListingSchema = z.object({
    title: z.string().min(3).max(200),
    description: z.string().min(10).max(10000),
    service_type: serviceTypeSchema,
    price_cents: z.number().int().min(0).nullable(),
    price_type: priceTypeSchema.nullable(),
    currency: z.string().length(3).default('EUR'),
    images: z.array(z.string().url()).max(10),
    service_area: z.string().max(200).nullable(),
    is_remote: z.boolean().default(false),
});

export const updateMarketplaceListingSchema = createMarketplaceListingSchema.partial();

export const createMarketplaceReviewSchema = z.object({
    listing_id: uuidSchema,
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(2000).nullable(),
});

// ============================================================
// NOTIFICATION SCHEMAS
// ============================================================

export const listNotificationsSchema = paginationSchema.extend({
    unread_only: z.boolean().optional(),
});

export const markNotificationReadSchema = z.object({
    notification_id: uuidSchema,
});

// ============================================================
// UPLOAD SCHEMAS
// ============================================================

export const bucketSchema = z.enum([
    'avatars', 'covers', 'exercises', 'exercise-videos',
    'post-media', 'club-logos', 'cvs', 'marketplace',
]);

export const getUploadUrlSchema = z.object({
    bucket: bucketSchema,
    filename: z.string().max(255),
    content_type: z.string().max(100),
});

export const confirmUploadSchema = z.object({
    bucket: bucketSchema,
    path: z.string().max(500),
});

export const deleteFileSchema = z.object({
    bucket: bucketSchema,
    path: z.string().max(500),
});

// ============================================================
// SUBSCRIPTION SCHEMAS
// ============================================================

export const getCheckoutUrlSchema = z.object({
    tier: z.enum(['premium_coach', 'pro_service', 'club_license']),
});

// ============================================================
// ADMIN SCHEMAS
// ============================================================

export const listUsersSchema = paginationSchema.extend({
    search: z.string().max(100).optional(),
    user_type: userTypeSchema.optional(),
    subscription_tier: subscriptionTierSchema.optional(),
    is_verified: z.boolean().optional(),
});

export const approveExerciseSchema = z.object({
    exercise_id: uuidSchema,
    approved: z.boolean(),
    rejection_reason: z.string().max(500).nullable(),
});

export const updateUserTierSchema = z.object({
    user_id: uuidSchema,
    tier: subscriptionTierSchema,
    expires_at: z.string().datetime().nullable(),
});