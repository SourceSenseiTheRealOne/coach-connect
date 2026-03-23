// ============================================================
// USER & PROFILE TYPES
// ============================================================

export type UserType = 'coach' | 'club' | 'scout' | 'trainer' | 'admin';
export type UEFALicense = 'C' | 'B' | 'A' | 'PRO';
export type SubscriptionTier = 'free' | 'premium_coach' | 'pro_service' | 'club_license';

export interface Profile {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    cover_image_url: string | null;
    bio: string | null;
    user_type: UserType;
    uefa_license: UEFALicense | null;
    is_verified: boolean;
    city: string | null;
    district: string | null;
    country: string;
    subscription_tier: SubscriptionTier;
    stripe_customer_id: string | null;
    subscription_expires_at: string | null;
    profile_views: number;
    created_at: string;
    updated_at: string;
}

export interface ClubProfile {
    id: string;
    club_name: string;
    founded_year: number | null;
    logo_url: string | null;
    website_url: string | null;
    webshop_url: string | null;
    max_sub_accounts: number;
    created_at: string;
}

export interface ClubMember {
    id: string;
    club_id: string;
    user_id: string;
    role: 'admin' | 'coach' | 'staff';
    created_at: string;
}

export interface ClubStaff {
    id: string;
    club_id: string;
    user_id: string;
    role: string;
    title: string | null;
    created_at: string;
}

// ============================================================
// EXERCISE TYPES
// ============================================================

export type ExerciseCategory =
    | 'warmup'
    | 'passing'
    | 'shooting'
    | 'dribbling'
    | 'defending'
    | 'goalkeeping'
    | 'tactical'
    | 'physical'
    | 'cooldown'
    | 'rondo'
    | 'small_sided_game'
    | 'set_piece';

export type AgeGroup =
    | 'U7' | 'U8' | 'U9' | 'U10' | 'U11' | 'U12' | 'U13'
    | 'U14' | 'U15' | 'U16' | 'U17' | 'U18' | 'U19' | 'senior';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type ExerciseStatus = 'pending' | 'approved' | 'rejected';

export interface Exercise {
    id: string;
    author_id: string;
    title: string;
    description: string | null;
    category: ExerciseCategory;
    age_group: AgeGroup;
    difficulty: Difficulty | null;
    image_url: string | null;
    animation_url: string | null;
    video_url: string | null;
    diagram_data: Record<string, unknown> | null;
    min_players: number | null;
    max_players: number | null;
    duration_minutes: number | null;
    equipment: string[] | null;
    is_premium: boolean;
    is_approved: boolean;
    status: ExerciseStatus;
    likes_count: number;
    views_count: number;
    created_at: string;
    updated_at: string;
}

export interface ExerciseReview {
    id: string;
    exercise_id: string;
    author_id: string;
    rating: number;
    comment: string | null;
    created_at: string;
}

// ============================================================
// PLANNER TYPES
// ============================================================

export type PlanType = '2_week' | 'month' | '3_month' | 'full_season';

export interface SeasonPlan {
    id: string;
    owner_id: string;
    club_id: string | null;
    title: string;
    age_group: AgeGroup;
    season_start: string;
    season_end: string;
    plan_type: PlanType;
    created_at: string;
    updated_at: string;
}

export interface TrainingSession {
    id: string;
    plan_id: string;
    title: string | null;
    scheduled_date: string;
    start_time: string | null;
    end_time: string | null;
    notes: string | null;
    sort_order: number;
    created_at: string;
}

export interface SessionExercise {
    id: string;
    session_id: string;
    exercise_id: string;
    sort_order: number;
    duration_minutes: number | null;
    notes: string | null;
}

// ============================================================
// TACTIC BOARD TYPES
// ============================================================

export interface TacticBoard {
    id: string;
    owner_id: string;
    title: string;
    board_data: Record<string, unknown>;
    animation_data: Record<string, unknown> | null;
    thumbnail_url: string | null;
    created_at: string;
    updated_at: string;
}

// ============================================================
// SOCIAL / FEED TYPES
// ============================================================

export type PostType = 'general' | 'match_report' | 'tactical_insight' | 'drill_share' | 'job_share';

export interface Post {
    id: string;
    author_id: string;
    content: string;
    post_type: PostType;
    media_urls: Array<{ url: string; type: string; caption?: string }>;
    exercise_id: string | null;
    likes_count: number;
    comments_count: number;
    shares_count: number;
    created_at: string;
    updated_at: string;
}

export interface PostComment {
    id: string;
    post_id: string;
    author_id: string;
    content: string;
    parent_comment_id: string | null;
    created_at: string;
}

export interface Connection {
    id: string;
    follower_id: string;
    following_id: string;
    status: 'following' | 'connected';
    created_at: string;
}

// ============================================================
// MESSAGING TYPES
// ============================================================

export interface Conversation {
    id: string;
    created_at: string;
    updated_at: string;
}

export interface ConversationParticipant {
    conversation_id: string;
    user_id: string;
    last_read_at: string;
}

export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    media_url: string | null;
    is_read: boolean;
    created_at: string;
}

// ============================================================
// JOB BOARD TYPES
// ============================================================

export type JobType =
    | 'head_coach'
    | 'assistant_coach'
    | 'goalkeeper_coach'
    | 'scout'
    | 'video_analyst'
    | 'physio'
    | 'fitness_coach'
    | 'director'
    | 'other';

export type ApplicationStatus = 'pending' | 'reviewed' | 'accepted' | 'rejected';

export interface JobListing {
    id: string;
    club_id: string;
    title: string;
    description: string;
    job_type: JobType;
    age_group: AgeGroup | null;
    is_paid: boolean;
    salary_range: string | null;
    location: string | null;
    application_deadline: string | null;
    is_active: boolean;
    applications_count: number;
    created_at: string;
    updated_at: string;
}

export interface JobApplication {
    id: string;
    listing_id: string;
    applicant_id: string;
    cover_letter: string | null;
    cv_url: string | null;
    status: ApplicationStatus;
    created_at: string;
}

// ============================================================
// FORUM TYPES
// ============================================================

export interface ForumCategory {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    sort_order: number;
}

export interface ForumThread {
    id: string;
    category_id: string;
    author_id: string;
    title: string;
    content: string;
    is_pinned: boolean;
    is_locked: boolean;
    views_count: number;
    replies_count: number;
    last_reply_at: string | null;
    created_at: string;
}

export interface ForumReply {
    id: string;
    thread_id: string;
    author_id: string;
    content: string;
    created_at: string;
}

// ============================================================
// MATCH TYPES
// ============================================================

export type MatchType = 'competition' | 'friendly' | 'tournament' | 'cup';
export type MatchStatus = 'scheduled' | 'completed' | 'cancelled';

export interface Match {
    id: string;
    created_by: string;
    club_id: string | null;
    home_team: string;
    away_team: string | null;
    match_type: MatchType;
    age_group: AgeGroup;
    match_date: string;
    kick_off_time: string | null;
    venue: string | null;
    city: string | null;
    district: string | null;
    is_public: boolean;
    home_score: number | null;
    away_score: number | null;
    status: MatchStatus;
    created_at: string;
}

export type MatchRequestStatus = 'open' | 'accepted' | 'expired' | 'cancelled';

export interface MatchRequest {
    id: string;
    requester_id: string;
    team_name: string;
    age_group: AgeGroup;
    preferred_date: string | null;
    preferred_time: string | null;
    location_preference: string | null;
    district: string | null;
    message: string | null;
    status: MatchRequestStatus;
    accepted_by: string | null;
    resulting_match_id: string | null;
    created_at: string;
    expires_at: string | null;
}

// ============================================================
// MARKETPLACE TYPES
// ============================================================

export type ServiceType =
    | 'private_training'
    | 'video_analysis'
    | 'consulting'
    | 'scouting'
    | 'event_organizing'
    | 'equipment'
    | 'other';

export type PriceType = 'fixed' | 'hourly' | 'per_session' | 'contact';

export interface MarketplaceListing {
    id: string;
    seller_id: string;
    title: string;
    description: string;
    service_type: ServiceType;
    price_cents: number | null;
    price_type: PriceType | null;
    currency: string;
    images: string[];
    service_area: string | null;
    is_remote: boolean;
    is_active: boolean;
    is_featured: boolean;
    views_count: number;
    stripe_price_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface MarketplaceReview {
    id: string;
    listing_id: string;
    reviewer_id: string;
    rating: number;
    comment: string | null;
    created_at: string;
}

// ============================================================
// NOTIFICATION TYPES
// ============================================================

export type NotificationType =
    | 'like'
    | 'comment'
    | 'follow'
    | 'connection_request'
    | 'message'
    | 'job_application'
    | 'match_request'
    | 'exercise_approved'
    | 'system';

export interface Notification {
    id: string;
    user_id: string;
    type: NotificationType;
    title: string;
    body: string | null;
    reference_type: string | null;
    reference_id: string | null;
    actor_id: string | null;
    is_read: boolean;
    created_at: string;
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface ApiError {
    code: string;
    message: string;
}