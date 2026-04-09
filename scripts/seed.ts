import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables (ES module compatible)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

// ============================================================
// MOCK DATA
// ============================================================

const mockUsers = [
    { email: 'joao.silva@example.com', password: 'Coach123!', username: 'joao_silva', full_name: 'João Silva', user_type: 'coach', uefa_license: 'B', city: 'Lisbon', district: 'Lisbon', country: 'Portugal', subscription_tier: 'premium_coach', bio: 'Passionate youth coach with 10 years of experience developing young talents.' },
    { email: 'maria.santos@example.com', password: 'Coach123!', username: 'maria_santos', full_name: 'Maria Santos', user_type: 'coach', uefa_license: 'A', city: 'Porto', district: 'Porto', country: 'Portugal', subscription_tier: 'premium_coach', bio: 'UEFA A licensed coach specializing in tactical periodization.' },
    { email: 'pedro.costa@example.com', password: 'Coach123!', username: 'pedro_costa', full_name: 'Pedro Costa', user_type: 'coach', uefa_license: 'PRO', city: 'Braga', district: 'Braga', country: 'Portugal', subscription_tier: 'pro_service', bio: 'Professional coach with experience in Primeira Liga.' },
    { email: 'ana.ferreira@example.com', password: 'Coach123!', username: 'ana_ferreira', full_name: 'Ana Ferreira', user_type: 'trainer', city: 'Coimbra', district: 'Coimbra', country: 'Portugal', subscription_tier: 'free', bio: 'Fitness trainer specialized in football conditioning.' },
    { email: 'carlos.oliveira@example.com', password: 'Coach123!', username: 'carlos_oliveira', full_name: 'Carlos Oliveira', user_type: 'scout', city: 'Faro', district: 'Faro', country: 'Portugal', subscription_tier: 'pro_service', bio: 'Talent scout covering Southern Portugal.' },
    { email: 'sofia.martins@example.com', password: 'Coach123!', username: 'sofia_martins', full_name: 'Sofia Martins', user_type: 'coach', uefa_license: 'C', city: 'Aveiro', district: 'Aveiro', country: 'Portugal', subscription_tier: 'free', bio: 'Youth coach starting my career in grassroots football.' },
    { email: 'ricardo.almeida@example.com', password: 'Coach123!', username: 'ricardo_almeida', full_name: 'Ricardo Almeida', user_type: 'coach', uefa_license: 'B', city: 'Viseu', district: 'Viseu', country: 'Portugal', subscription_tier: 'premium_coach', bio: 'Goalkeeper coach with passion for developing young keepers.' },
    { email: 'laura.rodrigues@example.com', password: 'Coach123!', username: 'laura_rodrigues', full_name: 'Laura Rodrigues', user_type: 'coach', uefa_license: 'A', city: 'Leiria', district: 'Leiria', country: 'Portugal', subscription_tier: 'club_license', bio: 'Academy director and head coach.' },
    { email: 'miguel.teixeira@example.com', password: 'Coach123!', username: 'miguel_teixeira', full_name: 'Miguel Teixeira', user_type: 'trainer', city: 'Setubal', district: 'Setúbal', country: 'Portugal', subscription_tier: 'free', bio: 'Video analyst and performance consultant.' },
    { email: 'beatriz.moreira@example.com', password: 'Coach123!', username: 'beatriz_moreira', full_name: 'Beatriz Moreira', user_type: 'coach', uefa_license: 'B', city: 'Guimaraes', district: 'Braga', country: 'Portugal', subscription_tier: 'premium_coach', bio: 'Women\'s football specialist and youth developer.' },
];

const mockClubs = [
    { club_name: 'Sporting Clube de Portugal Academy', founded_year: 1906, website_url: 'https://sporting.pt', max_sub_accounts: 20 },
    { club_name: 'FC Porto Youth Academy', founded_year: 1893, website_url: 'https://fcporto.pt', max_sub_accounts: 25 },
    { club_name: 'SL Benfica Campus', founded_year: 1904, website_url: 'https://benfica.pt', max_sub_accounts: 30 },
    { club_name: 'SC Braga Academy', founded_year: 1914, website_url: 'https://scbraga.pt', max_sub_accounts: 15 },
    { club_name: 'Vitória SC Youth', founded_year: 1922, website_url: 'https://vitoriasc.pt', max_sub_accounts: 10 },
];

const exerciseCategories = ['warmup', 'passing', 'shooting', 'dribbling', 'defending', 'goalkeeping', 'tactical', 'physical', 'cooldown', 'rondo', 'small_sided_game', 'set_piece'] as const;
const ageGroups = ['U7', 'U8', 'U9', 'U10', 'U11', 'U12', 'U13', 'U14', 'U15', 'U16', 'U17', 'U18', 'U19', 'senior'] as const;
const difficulties = ['beginner', 'intermediate', 'advanced'] as const;

const mockExercises: Array<{
    title: string;
    description: string;
    category: typeof exerciseCategories[number];
    age_group: typeof ageGroups[number];
    difficulty: typeof difficulties[number];
    min_players: number;
    max_players: number;
    duration_minutes: number;
    equipment: string[];
    is_premium: boolean;
    status: 'approved';
    is_approved: boolean;
}> = [
        { title: '4v4 Rondo with Transition', description: 'A dynamic rondo exercise that focuses on possession and quick transition play. Players must complete 5 passes before playing into the target player.', category: 'rondo', age_group: 'U14', difficulty: 'intermediate', min_players: 9, max_players: 9, duration_minutes: 15, equipment: ['balls', 'cones', 'bibs'], is_premium: false, status: 'approved', is_approved: true },
        { title: 'Box Passing Pattern', description: 'Structured passing exercise focusing on receiving on the half-turn and playing forward. Includes combination play and movement patterns.', category: 'passing', age_group: 'U12', difficulty: 'beginner', min_players: 6, max_players: 12, duration_minutes: 20, equipment: ['balls', 'cones'], is_premium: false, status: 'approved', is_approved: true },
        { title: 'Finishing Circuit', description: 'High-intensity finishing drill with multiple stations. Includes 1v1, first-time finishes, and aerial balls.', category: 'shooting', age_group: 'U16', difficulty: 'advanced', min_players: 8, max_players: 12, duration_minutes: 25, equipment: ['balls', 'goals', 'cones', 'mannequins'], is_premium: true, status: 'approved', is_approved: true },
        { title: 'Dynamic Warm-Up Protocol', description: 'Comprehensive warm-up routine incorporating activation, dynamic stretching, and ball work. Prepares players for high-intensity training.', category: 'warmup', age_group: 'senior', difficulty: 'beginner', min_players: 4, max_players: 20, duration_minutes: 15, equipment: ['balls', 'cones'], is_premium: false, status: 'approved', is_approved: true },
        { title: 'GK Shot Stopping & Distribution', description: 'Goalkeeper training focusing on reaction saves, positioning, and distribution techniques. Includes footwork drills.', category: 'goalkeeping', age_group: 'U15', difficulty: 'intermediate', min_players: 1, max_players: 4, duration_minutes: 30, equipment: ['balls', 'goals', 'cones'], is_premium: true, status: 'approved', is_approved: true },
        { title: 'Defensive Shape & Pressing', description: 'Team defensive exercise working on compact shape, pressing triggers, and defensive transitions.', category: 'defending', age_group: 'U17', difficulty: 'advanced', min_players: 10, max_players: 14, duration_minutes: 25, equipment: ['balls', 'goals', 'cones', 'bibs'], is_premium: true, status: 'approved', is_approved: true },
        { title: '1v1 Dribbling Gates', description: 'Individual dribbling exercise with gates. Players must beat defender and dribble through gates to score.', category: 'dribbling', age_group: 'U10', difficulty: 'beginner', min_players: 4, max_players: 12, duration_minutes: 15, equipment: ['balls', 'cones'], is_premium: false, status: 'approved', is_approved: true },
        { title: 'Tactical Phase: Build-Up Play', description: '11v11 tactical exercise focusing on building from the back. Includes constraints to encourage possession.', category: 'tactical', age_group: 'senior', difficulty: 'advanced', min_players: 18, max_players: 22, duration_minutes: 30, equipment: ['balls', 'goals', 'cones', 'bibs'], is_premium: true, status: 'approved', is_approved: true },
        { title: 'SAQ Circuit with Ball', description: 'Speed, agility, and quickness circuit integrated with ball work. Develops coordination and technical skills.', category: 'physical', age_group: 'U13', difficulty: 'intermediate', min_players: 4, max_players: 12, duration_minutes: 20, equipment: ['balls', 'cones', 'ladders', 'hurdles'], is_premium: false, status: 'approved', is_approved: true },
        { title: 'Cool-Down & Recovery', description: 'Structured cool-down with static stretching, foam rolling, and recovery protocols.', category: 'cooldown', age_group: 'senior', difficulty: 'beginner', min_players: 4, max_players: 30, duration_minutes: 10, equipment: ['foam rollers', 'mats'], is_premium: false, status: 'approved', is_approved: true },
        { title: '3-Team Possession Game', description: 'Competitive possession game with 3 teams. Two teams combine against one defending team.', category: 'small_sided_game', age_group: 'U15', difficulty: 'intermediate', min_players: 12, max_players: 18, duration_minutes: 20, equipment: ['balls', 'cones', 'bibs'], is_premium: false, status: 'approved', is_approved: true },
        { title: 'Corner Kick Routines', description: 'Set-piece training focusing on attacking and defending corner kicks. Multiple routines and variations.', category: 'set_piece', age_group: 'U18', difficulty: 'intermediate', min_players: 10, max_players: 22, duration_minutes: 25, equipment: ['balls', 'goals', 'cones'], is_premium: true, status: 'approved', is_approved: true },
        { title: '5v2 Rondo Basic', description: 'Fundamental rondo exercise for younger ages. Focus on first touch and simple passing.', category: 'rondo', age_group: 'U8', difficulty: 'beginner', min_players: 7, max_players: 7, duration_minutes: 10, equipment: ['balls', 'cones'], is_premium: false, status: 'approved', is_approved: true },
        { title: 'Through Ball & Finish', description: 'Passing exercise focusing on through balls and finishing. Includes combination play.', category: 'passing', age_group: 'U14', difficulty: 'intermediate', min_players: 6, max_players: 10, duration_minutes: 20, equipment: ['balls', 'goals', 'cones'], is_premium: false, status: 'approved', is_approved: true },
        { title: 'Crossing & Finishing Box', description: 'Wing play exercise focusing on quality crosses and various finishing techniques.', category: 'shooting', age_group: 'U17', difficulty: 'advanced', min_players: 8, max_players: 14, duration_minutes: 25, equipment: ['balls', 'goals', 'cones', 'mannequins'], is_premium: true, status: 'approved', is_approved: true },
        { title: 'Reactive Warm-Up Game', description: 'Fun warm-up game with reaction exercises and competitive elements.', category: 'warmup', age_group: 'U11', difficulty: 'beginner', min_players: 6, max_players: 16, duration_minutes: 12, equipment: ['balls', 'cones', 'bibs'], is_premium: false, status: 'approved', is_approved: true },
        { title: 'GK Crosses & High Balls', description: 'Goalkeeper training focusing on claiming crosses, high balls, and communication.', category: 'goalkeeping', age_group: 'U19', difficulty: 'advanced', min_players: 2, max_players: 6, duration_minutes: 25, equipment: ['balls', 'goals', 'cones'], is_premium: true, status: 'approved', is_approved: true },
        { title: 'Pressing Triggers Game', description: 'Small-sided game teaching when and how to press as a team.', category: 'defending', age_group: 'U16', difficulty: 'advanced', min_players: 8, max_players: 14, duration_minutes: 20, equipment: ['balls', 'goals', 'cones', 'bibs'], is_premium: true, status: 'approved', is_approved: true },
        { title: '2v1 Dribbling Overload', description: 'Simple 2v1 exercise focusing on dribbling and decision making.', category: 'dribbling', age_group: 'U9', difficulty: 'beginner', min_players: 6, max_players: 9, duration_minutes: 12, equipment: ['balls', 'cones'], is_premium: false, status: 'approved', is_approved: true },
        { title: 'Counter-Attack Practice', description: 'Tactical exercise focusing on quick transitions and counter-attacking play.', category: 'tactical', age_group: 'U18', difficulty: 'advanced', min_players: 10, max_players: 16, duration_minutes: 25, equipment: ['balls', 'goals', 'cones', 'bibs'], is_premium: true, status: 'approved', is_approved: true },
        { title: 'Endurance Fartlek Training', description: 'Football-specific endurance training with interval running and ball work.', category: 'physical', age_group: 'senior', difficulty: 'intermediate', min_players: 6, max_players: 20, duration_minutes: 25, equipment: ['balls', 'cones'], is_premium: false, status: 'approved', is_approved: true },
        { title: 'Mobility & Flexibility', description: 'Flexibility and mobility session for recovery and injury prevention.', category: 'cooldown', age_group: 'senior', difficulty: 'beginner', min_players: 2, max_players: 30, duration_minutes: 15, equipment: ['mats', 'bands'], is_premium: false, status: 'approved', is_approved: true },
        { title: '4 Goal Game', description: 'Small-sided game with 4 goals focusing on quick transitions and spatial awareness.', category: 'small_sided_game', age_group: 'U12', difficulty: 'intermediate', min_players: 8, max_players: 12, duration_minutes: 20, equipment: ['balls', 'goals', 'cones', 'bibs'], is_premium: false, status: 'approved', is_approved: true },
        { title: 'Free Kick Practice', description: 'Set-piece training for direct and indirect free kicks.', category: 'set_piece', age_group: 'U17', difficulty: 'intermediate', min_players: 6, max_players: 14, duration_minutes: 20, equipment: ['balls', 'goals', 'cones', 'mannequins'], is_premium: false, status: 'approved', is_approved: true },
        { title: '6v3 Rondo Advanced', description: 'Advanced rondo with higher pressure and quick transitions.', category: 'rondo', age_group: 'U17', difficulty: 'advanced', min_players: 9, max_players: 9, duration_minutes: 15, equipment: ['balls', 'cones', 'bibs'], is_premium: true, status: 'approved', is_approved: true },
        { title: 'Switching Play Exercise', description: 'Passing exercise focusing on switching play from one side to another.', category: 'passing', age_group: 'U15', difficulty: 'intermediate', min_players: 10, max_players: 16, duration_minutes: 20, equipment: ['balls', 'cones', 'bibs'], is_premium: false, status: 'approved', is_approved: true },
        { title: 'Volley & Half-Volley Finishing', description: 'Technical finishing drill focusing on volleys and half-volleys.', category: 'shooting', age_group: 'U16', difficulty: 'advanced', min_players: 4, max_players: 10, duration_minutes: 20, equipment: ['balls', 'goals', 'cones'], is_premium: true, status: 'approved', is_approved: true },
        { title: 'Tag Games Warm-Up', description: 'Fun tag games for young players to start training.', category: 'warmup', age_group: 'U7', difficulty: 'beginner', min_players: 6, max_players: 16, duration_minutes: 10, equipment: ['bibs'], is_premium: false, status: 'approved', is_approved: true },
        { title: 'GK Diving Technique', description: 'Goalkeeper diving technique training for beginners.', category: 'goalkeeping', age_group: 'U11', difficulty: 'beginner', min_players: 1, max_players: 4, duration_minutes: 20, equipment: ['balls', 'goals', 'cones'], is_premium: false, status: 'approved', is_approved: true },
        { title: 'Defensive Recovery Runs', description: 'Exercise focusing on recovery runs and defensive positioning.', category: 'defending', age_group: 'U14', difficulty: 'intermediate', min_players: 6, max_players: 10, duration_minutes: 15, equipment: ['balls', 'goals', 'cones'], is_premium: false, status: 'approved', is_approved: true },
        { title: 'Skill Moves 1v1', description: 'Learning and practicing skill moves in 1v1 situations.', category: 'dribbling', age_group: 'U11', difficulty: 'intermediate', min_players: 4, max_players: 12, duration_minutes: 20, equipment: ['balls', 'cones'], is_premium: false, status: 'approved', is_approved: true },
        { title: 'Playing Out from Back', description: 'Tactical exercise for building attacks from the goalkeeper.', category: 'tactical', age_group: 'U15', difficulty: 'intermediate', min_players: 10, max_players: 14, duration_minutes: 25, equipment: ['balls', 'goals', 'cones', 'bibs'], is_premium: true, status: 'approved', is_approved: true },
        { title: 'Plyometric Training', description: 'Plyometric exercises for power development.', category: 'physical', age_group: 'U18', difficulty: 'advanced', min_players: 4, max_players: 12, duration_minutes: 20, equipment: ['boxes', 'hurdles', 'cones'], is_premium: true, status: 'approved', is_approved: true },
        { title: 'Yoga for Footballers', description: 'Yoga session specifically designed for football recovery.', category: 'cooldown', age_group: 'senior', difficulty: 'beginner', min_players: 2, max_players: 20, duration_minutes: 20, equipment: ['mats'], is_premium: false, status: 'approved', is_approved: true },
        { title: 'Wave Game 4-4-2', description: 'Tactical game working on 4-4-2 formation patterns.', category: 'small_sided_game', age_group: 'U19', difficulty: 'advanced', min_players: 14, max_players: 18, duration_minutes: 30, equipment: ['balls', 'goals', 'cones', 'bibs'], is_premium: true, status: 'approved', is_approved: true },
        { title: 'Penalty Practice', description: 'Penalty kick practice with pressure scenarios.', category: 'set_piece', age_group: 'U14', difficulty: 'beginner', min_players: 2, max_players: 10, duration_minutes: 15, equipment: ['balls', 'goals'], is_premium: false, status: 'approved', is_approved: true },
        { title: 'Possession 8v8', description: 'Large possession game focusing on maintaining possession.', category: 'small_sided_game', age_group: 'U13', difficulty: 'intermediate', min_players: 16, max_players: 16, duration_minutes: 25, equipment: ['balls', 'cones', 'bibs'], is_premium: false, status: 'approved', is_approved: true },
        { title: 'Triangle Passing', description: 'Basic triangle passing for young players.', category: 'passing', age_group: 'U8', difficulty: 'beginner', min_players: 3, max_players: 9, duration_minutes: 10, equipment: ['balls', 'cones'], is_premium: false, status: 'approved', is_approved: true },
        { title: 'Shields & Hold-Up Play', description: 'Exercise focusing on shielding the ball and hold-up play for strikers.', category: 'defending', age_group: 'U16', difficulty: 'intermediate', min_players: 4, max_players: 8, duration_minutes: 15, equipment: ['balls', 'cones'], is_premium: false, status: 'approved', is_approved: true },
        { title: 'Chip & Lob Practice', description: 'Technical drill for chipping and lobbing the ball.', category: 'passing', age_group: 'U13', difficulty: 'intermediate', min_players: 4, max_players: 8, duration_minutes: 15, equipment: ['balls', 'cones', 'goals'], is_premium: false, status: 'approved', is_approved: true },
        { title: 'Reaction Shooting', description: 'Fast-paced shooting drill with reaction elements.', category: 'shooting', age_group: 'U12', difficulty: 'intermediate', min_players: 4, max_players: 10, duration_minutes: 15, equipment: ['balls', 'goals', 'cones'], is_premium: false, status: 'approved', is_approved: true },
        { title: 'Balance & Coordination U9', description: 'Balance and coordination exercises for young players.', category: 'physical', age_group: 'U9', difficulty: 'beginner', min_players: 4, max_players: 12, duration_minutes: 15, equipment: ['cones', 'ladders'], is_premium: false, status: 'approved', is_approved: true },
        { title: 'GK Footwork Basics', description: 'Basic footwork exercises for young goalkeepers.', category: 'goalkeeping', age_group: 'U10', difficulty: 'beginner', min_players: 1, max_players: 4, duration_minutes: 15, equipment: ['balls', 'cones', 'ladders'], is_premium: false, status: 'approved', is_approved: true },
        { title: '2v2 Transition Game', description: 'Small-sided game focusing on quick transitions.', category: 'small_sided_game', age_group: 'U10', difficulty: 'beginner', min_players: 4, max_players: 8, duration_minutes: 15, equipment: ['balls', 'goals', 'cones'], is_premium: false, status: 'approved', is_approved: true },
        { title: 'Long Throw Practice', description: 'Training for long throw-ins.', category: 'set_piece', age_group: 'U15', difficulty: 'intermediate', min_players: 4, max_players: 10, duration_minutes: 15, equipment: ['balls', 'cones'], is_premium: false, status: 'approved', is_approved: true },
        { title: 'Rondo 5v2 Variations', description: '5v2 Rondo with multiple progressions and constraints.', category: 'rondo', age_group: 'U11', difficulty: 'intermediate', min_players: 7, max_players: 7, duration_minutes: 12, equipment: ['balls', 'cones'], is_premium: false, status: 'approved', is_approved: true },
        { title: 'Winger Crossing Drill', description: 'Exercise for wingers focusing on crossing technique.', category: 'passing', age_group: 'U16', difficulty: 'intermediate', min_players: 6, max_players: 10, duration_minutes: 20, equipment: ['balls', 'goals', 'cones'], is_premium: false, status: 'approved', is_approved: true },
        { title: 'Power Shooting', description: 'Shooting drill focusing on power and technique.', category: 'shooting', age_group: 'U14', difficulty: 'intermediate', min_players: 4, max_players: 10, duration_minutes: 20, equipment: ['balls', 'goals', 'cones'], is_premium: false, status: 'approved', is_approved: true },
        { title: 'Defensive Heading', description: 'Defensive heading technique and positioning.', category: 'defending', age_group: 'U15', difficulty: 'intermediate', min_players: 4, max_players: 10, duration_minutes: 15, equipment: ['balls', 'cones'], is_premium: false, status: 'approved', is_approved: true },
        { title: '3v3 Tournament Games', description: 'Fun 3v3 tournament format for training sessions.', category: 'small_sided_game', age_group: 'U10', difficulty: 'beginner', min_players: 12, max_players: 24, duration_minutes: 30, equipment: ['balls', 'goals', 'cones', 'bibs'], is_premium: false, status: 'approved', is_approved: true },
    ];

const mockJobs = [
    { title: 'Head Coach - U15 Academy', description: 'We are looking for an experienced UEFA B licensed coach to lead our U15 academy team. The role involves training sessions 4 times per week plus weekend matches.', job_type: 'head_coach', age_group: 'U15', is_paid: true, salary_range: '€25,000 - €35,000/year', location: 'Lisbon, Portugal', is_active: true },
    { title: 'Assistant Coach - First Team', description: 'Assistant coach position available for our first team. Must have UEFA A license and 3+ years experience at senior level.', job_type: 'assistant_coach', age_group: 'senior', is_paid: true, salary_range: '€40,000 - €55,000/year', location: 'Porto, Portugal', is_active: true },
    { title: 'Goalkeeper Coach', description: 'Seeking a specialized goalkeeper coach for our youth academy. Experience with ages U12-U18 required.', job_type: 'goalkeeper_coach', age_group: 'U12', is_paid: true, salary_range: '€20,000 - €28,000/year', location: 'Braga, Portugal', is_active: true },
    { title: 'Youth Scout - Northern Region', description: 'Part-time scout position covering the Northern Portugal region. Flexible hours, match attendance required on weekends.', job_type: 'scout', is_paid: true, salary_range: '€500 - €800/month', location: 'Porto, Portugal', is_active: true },
    { title: 'Video Analyst', description: 'Full-time video analyst position. Responsibilities include match analysis, opponent scouting, and player performance tracking.', job_type: 'video_analyst', age_group: 'senior', is_paid: true, salary_range: '€30,000 - €40,000/year', location: 'Lisbon, Portugal', is_active: true },
    { title: 'Head Coach - Women\'s Team', description: 'Exciting opportunity to lead our women\'s first team. UEFA A license required, experience in women\'s football preferred.', job_type: 'head_coach', age_group: 'senior', is_paid: true, salary_range: '€35,000 - €45,000/year', location: 'Coimbra, Portugal', is_active: true },
    { title: 'Fitness Coach', description: 'Looking for a certified fitness coach to join our performance team. Must have sports science degree and football experience.', job_type: 'fitness_coach', is_paid: true, salary_range: '€25,000 - €32,000/year', location: 'Faro, Portugal', is_active: true },
    { title: 'Academy Director', description: 'Senior leadership role overseeing our youth academy operations. UEFA PRO license and management experience required.', job_type: 'director', is_paid: true, salary_range: '€50,000 - €70,000/year', location: 'Lisbon, Portugal', is_active: true },
    { title: 'U10 Coach - Part Time', description: 'Part-time coaching position for U10 age group. Evenings and weekends. Great opportunity for developing coaches.', job_type: 'head_coach', age_group: 'U10', is_paid: true, salary_range: '€800 - €1,200/month', location: 'Aveiro, Portugal', is_active: true },
    { title: 'Physiotherapist', description: 'Club physiotherapist position available. Must be licensed and have sports injury experience.', job_type: 'physio', is_paid: true, salary_range: '€28,000 - €35,000/year', location: 'Guimaraes, Portugal', is_active: true },
    { title: 'U17 Assistant Coach', description: 'Assistant coach for our U17 competitive team. UEFA B license minimum. 3 training sessions per week plus matches.', job_type: 'assistant_coach', age_group: 'U17', is_paid: true, salary_range: '€15,000 - €20,000/year', location: 'Viseu, Portugal', is_active: true },
    { title: 'Technical Director', description: 'Technical director role overseeing all football operations. Extensive coaching and management experience required.', job_type: 'director', is_paid: true, salary_range: '€60,000 - €80,000/year', location: 'Porto, Portugal', is_active: true },
    { title: 'U13 Head Coach', description: 'Head coach for U13 team. Focus on player development and technical skills. UEFA B license preferred.', job_type: 'head_coach', age_group: 'U13', is_paid: true, salary_range: '€18,000 - €24,000/year', location: 'Leiria, Portugal', is_active: true },
    { title: 'Performance Analyst Intern', description: '6-month internship for sports science graduates. Learn video analysis and performance tracking.', job_type: 'video_analyst', is_paid: true, salary_range: '€600/month', location: 'Lisbon, Portugal', is_active: true },
    { title: 'Head of Recruitment', description: 'Lead our scouting and recruitment department. Experience in talent identification and network building required.', job_type: 'scout', is_paid: true, salary_range: '€45,000 - €55,000/year', location: 'Lisbon, Portugal', is_active: true },
    { title: 'U19 Goalkeeper Coach', description: 'Specialized goalkeeper coach for U19 team. Experience with elite youth goalkeepers required.', job_type: 'goalkeeper_coach', age_group: 'U19', is_paid: true, salary_range: '€22,000 - €28,000/year', location: 'Braga, Portugal', is_active: true },
    { title: 'Community Coach', description: 'Community coaching role delivering programs in local schools. Great entry-level opportunity.', job_type: 'head_coach', age_group: 'U8', is_paid: true, salary_range: '€1,000 - €1,400/month', location: 'Setubal, Portugal', is_active: true },
    { title: 'Set Piece Specialist', description: 'Specialist coach focusing on set pieces. Part-time consultancy role with flexible hours.', job_type: 'other', age_group: 'senior', is_paid: true, salary_range: '€1,500 - €2,000/month', location: 'Remote', is_active: true },
    { title: 'U16 Head Coach', description: 'Head coach for competitive U16 team. League and cup competition involvement. UEFA B license required.', job_type: 'head_coach', age_group: 'U16', is_paid: true, salary_range: '€22,000 - €28,000/year', location: 'Faro, Portugal', is_active: true },
    { title: 'Rehabilitation Coach', description: 'Specialist coach for injured players returning to fitness. Sports science background required.', job_type: 'fitness_coach', is_paid: true, salary_range: '€28,000 - €35,000/year', location: 'Porto, Portugal', is_active: true },
];

const mockForumCategories = [
    { name: 'General Discussion', slug: 'general-discussion', description: 'General football coaching discussions', sort_order: 1 },
    { name: 'Training Drills & Exercises', slug: 'training-drills', description: 'Share and discuss training drills', sort_order: 2 },
    { name: 'Tactics & Formations', slug: 'tactics-formations', description: 'Tactical discussions and analysis', sort_order: 3 },
    { name: 'Youth Development', slug: 'youth-development', description: 'Youth player development topics', sort_order: 4 },
    { name: 'Career & Jobs', slug: 'career-jobs', description: 'Career advice and job opportunities', sort_order: 5 },
];

const mockMarketplaceListings = [
    { title: 'Private 1-on-1 Coaching Sessions', description: 'Individual coaching sessions for players aged 10-16. Focus on technical skills, game intelligence, and physical development. Sessions held in Lisbon area.', service_type: 'private_training', price_cents: 4000, price_type: 'per_session', service_area: 'Lisbon', is_remote: false, is_active: true },
    { title: 'Video Match Analysis Service', description: 'Professional video analysis of matches or training sessions. Includes tactical report and player performance metrics.', service_type: 'video_analysis', price_cents: 7500, price_type: 'fixed', service_area: 'Portugal', is_remote: true, is_active: true },
    { title: 'Coach Consultation - Career Guidance', description: 'One-hour consultation for coaches looking to advance their career. CV review, interview preparation, and career path planning.', service_type: 'consulting', price_cents: 5000, price_type: 'hourly', service_area: 'Remote', is_remote: true, is_active: true },
    { title: 'Talent Scouting Reports', description: 'Detailed scouting reports on players in Northern Portugal. Includes video footage and technical assessment.', service_type: 'scouting', price_cents: 15000, price_type: 'fixed', service_area: 'Northern Portugal', is_remote: false, is_active: true },
    { title: 'Training Camp Organization', description: 'Full-service training camp organization. Includes facilities, accommodation, and match scheduling.', service_type: 'event_organizing', price_cents: 0, price_type: 'contact', service_area: 'Portugal', is_remote: false, is_active: true },
    { title: 'Football Training Equipment Bundle', description: 'Professional training equipment including cones, bibs, balls, and goals. Perfect for new coaches.', service_type: 'equipment', price_cents: 25000, price_type: 'fixed', service_area: 'Portugal', is_remote: false, is_active: true },
    { title: 'Goalkeeper Training Program', description: 'Specialized 8-week goalkeeper training program. Group sessions with max 4 goalkeepers.', service_type: 'private_training', price_cents: 12000, price_type: 'per_session', service_area: 'Porto', is_remote: false, is_active: true },
    { title: 'Team Tactical Analysis', description: 'Full tactical analysis of your team. Includes formation analysis, player roles, and improvement recommendations.', service_type: 'video_analysis', price_cents: 20000, price_type: 'fixed', service_area: 'Portugal', is_remote: true, is_active: true },
    { title: 'UEFA License Preparation Course', description: 'Preparation course for UEFA B and A license exams. Theory and practical sessions included.', service_type: 'consulting', price_cents: 30000, price_type: 'fixed', service_area: 'Lisbon', is_remote: false, is_active: true },
    { title: 'Youth Tournament Organization', description: 'Complete youth tournament organization service. Ages U8-U16, multiple formats available.', service_type: 'event_organizing', price_cents: 0, price_type: 'contact', service_area: 'Portugal', is_remote: false, is_active: true },
];

// ============================================================
// SEED FUNCTIONS
// ============================================================

async function seedUsers() {
    console.log('Seeding users...');
    const userIds: string[] = [];

    for (const user of mockUsers) {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: user.email,
            password: user.password,
            email_confirm: true,
        });

        if (authError) {
            console.error(`Error creating auth user ${user.email}:`, authError.message);
            continue;
        }

        const userId = authData.user.id;
        userIds.push(userId);

        // Create profile
        const { error: profileError } = await supabase.from('profiles').insert({
            id: userId,
            username: user.username,
            full_name: user.full_name,
            user_type: user.user_type,
            uefa_license: user.uefa_license || null,
            city: user.city,
            district: user.district,
            country: user.country,
            subscription_tier: user.subscription_tier,
            bio: user.bio,
            is_verified: user.subscription_tier !== 'free',
        });

        if (profileError) {
            console.error(`Error creating profile ${user.username}:`, profileError.message);
        } else {
            console.log(`Created user: ${user.username}`);
        }
    }

    return userIds;
}

async function seedClubs() {
    console.log('Seeding clubs...');
    const clubIds: string[] = [];

    for (const club of mockClubs) {
        const { data, error } = await supabase.from('clubs').insert(club).select('id').single();

        if (error) {
            console.error(`Error creating club ${club.club_name}:`, error.message);
        } else {
            clubIds.push(data.id);
            console.log(`Created club: ${club.club_name}`);
        }
    }

    return clubIds;
}

async function seedExercises(userIds: string[]) {
    console.log('Seeding exercises...');

    for (let i = 0; i < mockExercises.length; i++) {
        const exercise = mockExercises[i];
        const authorId = userIds[i % userIds.length];

        const { error } = await supabase.from('exercises').insert({
            ...exercise,
            author_id: authorId,
        });

        if (error) {
            console.error(`Error creating exercise ${exercise.title}:`, error.message);
        } else {
            console.log(`Created exercise: ${exercise.title}`);
        }
    }
}

async function seedJobs(clubIds: string[]) {
    console.log('Seeding jobs...');

    for (let i = 0; i < mockJobs.length; i++) {
        const job = mockJobs[i];
        const clubId = clubIds[i % clubIds.length];

        const { error } = await supabase.from('job_listings').insert({
            ...job,
            club_id: clubId,
        });

        if (error) {
            console.error(`Error creating job ${job.title}:`, error.message);
        } else {
            console.log(`Created job: ${job.title}`);
        }
    }
}

async function seedForumCategories() {
    console.log('Seeding forum categories...');

    for (const category of mockForumCategories) {
        const { error } = await supabase.from('forum_categories').insert(category);

        if (error) {
            console.error(`Error creating forum category ${category.name}:`, error.message);
        } else {
            console.log(`Created forum category: ${category.name}`);
        }
    }
}

async function seedMarketplace(userIds: string[]) {
    console.log('Seeding marketplace listings...');

    for (let i = 0; i < mockMarketplaceListings.length; i++) {
        const listing = mockMarketplaceListings[i];
        const sellerId = userIds[i % userIds.length];

        const { error } = await supabase.from('marketplace_listings').insert({
            ...listing,
            seller_id: sellerId,
            images: [],
        });

        if (error) {
            console.error(`Error creating marketplace listing ${listing.title}:`, error.message);
        } else {
            console.log(`Created marketplace listing: ${listing.title}`);
        }
    }
}

async function seedPosts(userIds: string[]) {
    console.log('Seeding posts...');

    const posts = [
        { content: 'Just completed my UEFA A license! Excited to apply new knowledge with my team. #CoachingJourney', post_type: 'general' },
        { content: 'Great session today working on pressing triggers with the U16s. They\'re really starting to understand when to press as a unit!', post_type: 'tactical_insight' },
        { content: 'Match Report: 3-1 win against our local rivals. Goals from set pieces made the difference. Proud of the team\'s discipline today.', post_type: 'match_report' },
        { content: 'New drill I created for switching play - would love feedback from other coaches! Link in comments.', post_type: 'drill_share' },
        { content: 'The importance of building relationships with young players cannot be overstated. Trust is the foundation of development.', post_type: 'general' },
        { content: 'Video analysis session with the first team yesterday. Identified 3 key areas for improvement in our build-up play.', post_type: 'tactical_insight' },
        { content: 'Looking for friendly matches for our U14 team in the Lisbon area. DM if interested!', post_type: 'general' },
        { content: 'Tip for young coaches: Never stop learning. Watch games, take notes, analyze, and most importantly, reflect on your own sessions.', post_type: 'general' },
        { content: 'Implemented a new rondo progression today. The players loved the competitive element!', post_type: 'drill_share' },
        { content: 'Player development is a marathon, not a sprint. Patience and consistency are key.', post_type: 'general' },
    ];

    for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        const authorId = userIds[i % userIds.length];

        const { error } = await supabase.from('posts').insert({
            ...post,
            author_id: authorId,
        });

        if (error) {
            console.error(`Error creating post:`, error.message);
        } else {
            console.log(`Created post ${i + 1}`);
        }
    }
}

async function seedConnections(userIds: string[]) {
    console.log('Seeding connections...');

    // Create some follow relationships
    const connections = [
        { follower_index: 0, following_index: 1 },
        { follower_index: 0, following_index: 2 },
        { follower_index: 1, following_index: 0 },
        { follower_index: 1, following_index: 3 },
        { follower_index: 2, following_index: 4 },
        { follower_index: 3, following_index: 0 },
        { follower_index: 4, following_index: 1 },
        { follower_index: 5, following_index: 0 },
        { follower_index: 6, following_index: 1 },
        { follower_index: 7, following_index: 2 },
    ];

    for (const conn of connections) {
        const { error } = await supabase.from('connections').insert({
            follower_id: userIds[conn.follower_index],
            following_id: userIds[conn.following_index],
            status: 'following',
        });

        if (error) {
            console.error(`Error creating connection:`, error.message);
        }
    }
    console.log('Created connections');
}

async function seedNotifications(userIds: string[]) {
    console.log('Seeding notifications...');

    const notifications = [
        { type: 'system', title: 'Welcome to Coach Connect!', body: 'Thanks for joining our community of football coaches.' },
        { type: 'system', title: 'Complete Your Profile', body: 'Add your UEFA license and bio to connect with more coaches.' },
        { type: 'exercise_approved', title: 'Exercise Approved', body: 'Your exercise "4v4 Rondo" has been approved and is now live!' },
    ];

    for (const userId of userIds) {
        for (const notif of notifications) {
            const { error } = await supabase.from('notifications').insert({
                user_id: userId,
                ...notif,
            });

            if (error) {
                console.error(`Error creating notification:`, error.message);
            }
        }
    }
    console.log('Created notifications');
}

async function seedPlanner(userIds: string[]) {
    console.log('Seeding planner data...');

    // Create season plans for the first 3 users
    const mockPlans = [
        { title: 'U15 Season 2025/26', age_group: 'U15', season_start: '2025-09-01', season_end: '2026-06-30', plan_type: 'full_season' },
        { title: 'U12 Development Plan', age_group: 'U12', season_start: '2025-09-01', season_end: '2026-06-30', plan_type: 'full_season' },
        { title: 'Pre-Season Intensive', age_group: 'U17', season_start: '2026-01-06', season_end: '2026-03-31', plan_type: '3_month' },
    ];

    const planIds: string[] = [];

    for (let i = 0; i < mockPlans.length; i++) {
        const plan = mockPlans[i];
        const ownerId = userIds[i % userIds.length];

        const { data, error } = await supabase.from('season_plans').insert({
            ...plan,
            owner_id: ownerId,
        }).select('id').single();

        if (error) {
            console.error(`Error creating plan ${plan.title}:`, error.message);
        } else {
            planIds.push(data.id);
            console.log(`Created plan: ${plan.title}`);
        }
    }

    // Create training sessions for the first plan (current week)
    const now = new Date();
    const currentDay = now.getDay();
    const monday = new Date(now);
    const diff = currentDay === 0 ? -6 : 1 - currentDay;
    monday.setDate(now.getDate() + diff);

    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const mockSessions = [
        { dayOffset: 0, title: 'Passing & Possession', start_time: '10:00', end_time: '11:30', notes: 'Focus on quick passing combinations and ball retention.' },
        { dayOffset: 1, title: 'Defensive Shape', start_time: '10:00', end_time: '11:30', notes: 'Working on defensive positioning and pressing.' },
        { dayOffset: 2, title: 'Shooting & Finishing', start_time: '14:00', end_time: '15:30', notes: 'Various finishing drills and 1v1 situations.' },
        { dayOffset: 3, title: 'Tactical Walkthrough', start_time: '10:00', end_time: '11:00', notes: 'Set pieces and formation review.' },
        { dayOffset: 4, title: 'Small-Sided Games', start_time: '10:00', end_time: '11:30', notes: 'Competitive games focusing on the week\'s topics.' },
        { dayOffset: 5, title: 'Match Day Prep', start_time: '09:00', end_time: '10:00', notes: 'Light activation and tactical briefing.' },
    ];

    for (const planId of planIds) {
        for (const session of mockSessions) {
            const sessionDate = new Date(monday);
            sessionDate.setDate(monday.getDate() + session.dayOffset);
            const dateStr = sessionDate.toISOString().split('T')[0];

            const { data: sessionData, error } = await supabase.from('training_sessions').insert({
                plan_id: planId,
                title: session.title,
                scheduled_date: dateStr,
                start_time: session.start_time,
                end_time: session.end_time,
                notes: session.notes,
            }).select('id').single();

            if (error) {
                console.error(`Error creating session ${session.title}:`, error.message);
            } else {
                console.log(`Created session: ${session.title}`);

                // Add some exercises to sessions
                const exerciseCount = 2 + Math.floor(Math.random() * 2);
                for (let j = 0; j < exerciseCount; j++) {
                    const exerciseId = (j + 1).toString(); // won't match real IDs, but shows structure
                    // Skip actually inserting since exercise IDs would need to exist
                }
            }
        }
    }

    console.log('Created planner data');
}

async function seedTacticBoards(userIds: string[]) {
    console.log('Seeding tactic boards...');

    const formations: Record<string, Array<{ x: number; y: number; label: string }>> = {
        '4-3-3': [
            { x: 10, y: 50, label: 'GK' }, { x: 25, y: 15, label: 'LB' }, { x: 25, y: 38, label: 'CB' },
            { x: 25, y: 62, label: 'CB' }, { x: 25, y: 85, label: 'RB' }, { x: 45, y: 25, label: 'CM' },
            { x: 45, y: 50, label: 'CM' }, { x: 45, y: 75, label: 'CM' }, { x: 70, y: 15, label: 'LW' },
            { x: 75, y: 50, label: 'ST' }, { x: 70, y: 85, label: 'RW' },
        ],
        '4-4-2': [
            { x: 10, y: 50, label: 'GK' }, { x: 25, y: 15, label: 'LB' }, { x: 25, y: 38, label: 'CB' },
            { x: 25, y: 62, label: 'CB' }, { x: 25, y: 85, label: 'RB' }, { x: 50, y: 15, label: 'LM' },
            { x: 50, y: 38, label: 'CM' }, { x: 50, y: 62, label: 'CM' }, { x: 50, y: 85, label: 'RM' },
            { x: 75, y: 38, label: 'ST' }, { x: 75, y: 62, label: 'ST' },
        ],
        '3-5-2': [
            { x: 10, y: 50, label: 'GK' }, { x: 25, y: 25, label: 'CB' }, { x: 25, y: 50, label: 'CB' },
            { x: 25, y: 75, label: 'CB' }, { x: 45, y: 10, label: 'LWB' }, { x: 45, y: 35, label: 'CM' },
            { x: 45, y: 50, label: 'CM' }, { x: 45, y: 65, label: 'CM' }, { x: 45, y: 90, label: 'RWB' },
            { x: 70, y: 38, label: 'ST' }, { x: 70, y: 62, label: 'ST' },
        ],
    };

    const opposingPlayers = [
        { x: 90, y: 50, label: 'GK' }, { x: 75, y: 85, label: 'LB' }, { x: 75, y: 62, label: 'CB' },
        { x: 75, y: 38, label: 'CB' }, { x: 75, y: 15, label: 'RB' }, { x: 55, y: 75, label: 'CM' },
        { x: 55, y: 50, label: 'CM' }, { x: 55, y: 25, label: 'CM' }, { x: 35, y: 85, label: 'LW' },
        { x: 30, y: 50, label: 'ST' }, { x: 35, y: 15, label: 'RW' },
    ];

    const mockBoards = [
        {
            title: 'Match vs Barcelona - 4-3-3 Attack',
            formation: '4-3-3' as const,
            arrows: [
                { id: 'arrow-1', startX: 45, startY: 25, endX: 70, endY: 15, color: '#3b82f6', type: 'solid' },
                { id: 'arrow-2', startX: 45, startY: 75, endX: 70, endY: 85, color: '#3b82f6', type: 'solid' },
                { id: 'arrow-3', startX: 45, startY: 50, endX: 75, endY: 50, color: '#ef4444', type: 'dashed' },
            ],
            is_public: true,
        },
        {
            title: 'Defensive Shape - 4-4-2 Block',
            formation: '4-4-2' as const,
            arrows: [],
            is_public: false,
        },
        {
            title: 'Counter Attack - 3-5-2',
            formation: '3-5-2' as const,
            arrows: [
                { id: 'arrow-1', startX: 45, startY: 10, endX: 70, endY: 38, color: '#22c55e', type: 'solid' },
                { id: 'arrow-2', startX: 45, startY: 90, endX: 70, endY: 62, color: '#22c55e', type: 'solid' },
            ],
            is_public: true,
        },
    ];

    for (let i = 0; i < mockBoards.length; i++) {
        const board = mockBoards[i];
        const ownerId = userIds[i % userIds.length];
        const formationPlayers = formations[board.formation] || formations['4-3-3'];

        const boardData = {
            formation: board.formation,
            players: [
                ...formationPlayers.map((p, j) => ({ ...p, id: `home-${j}`, team: 'home' as const })),
                ...opposingPlayers.map((p, j) => ({ ...p, id: `away-${j}`, team: 'away' as const })),
            ],
            arrows: board.arrows,
            is_public: board.is_public,
        };

        const { error } = await supabase.from('tactic_boards').insert({
            owner_id: ownerId,
            title: board.title,
            board_data: boardData,
            animation_data: null,
            thumbnail_url: null,
        });

        if (error) {
            console.error(`Error creating tactic board ${board.title}:`, error.message);
        } else {
            console.log(`Created tactic board: ${board.title}`);
        }
    }
}

async function main() {
    console.log('Starting seed process...\n');

    try {
        const userIds = await seedUsers();
        const clubIds = await seedClubs();

        await seedExercises(userIds);
        await seedJobs(clubIds);
        await seedForumCategories();
        await seedMarketplace(userIds);
        await seedPosts(userIds);
        await seedConnections(userIds);
        await seedNotifications(userIds);
        await seedPlanner(userIds);
        await seedTacticBoards(userIds);

        console.log('\n✅ Seed completed successfully!');
    } catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
}

main();
