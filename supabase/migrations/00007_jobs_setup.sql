-- ============================================================
-- JOBS SETUP
-- ============================================================

-- Create job_listings table
CREATE TABLE IF NOT EXISTS public.job_listings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('head_coach', 'assistant_coach', 'goalkeeper_coach', 'scout', 'video_analyst', 'physio', 'fitness_coach', 'director', 'other')),
    age_group VARCHAR(10) CHECK (age_group IN ('U7', 'U8', 'U9', 'U10', 'U11', 'U12', 'U13', 'U14', 'U15', 'U16', 'U17', 'U18', 'U19', 'senior')),
    is_paid BOOLEAN DEFAULT true,
    salary_range VARCHAR(100),
    location VARCHAR(200),
    application_deadline DATE,
    is_active BOOLEAN DEFAULT true,
    applications_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create job_applications table
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    listing_id UUID REFERENCES public.job_listings(id) ON DELETE CASCADE,
    applicant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    cover_letter TEXT,
    cv_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(listing_id, applicant_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_job_listings_club_id ON public.job_listings(club_id);
CREATE INDEX IF NOT EXISTS idx_job_listings_job_type ON public.job_listings(job_type);
CREATE INDEX IF NOT EXISTS idx_job_listings_age_group ON public.job_listings(age_group);
CREATE INDEX IF NOT EXISTS idx_job_listings_location ON public.job_listings(location);
CREATE INDEX IF NOT EXISTS idx_job_listings_is_active ON public.job_listings(is_active);
CREATE INDEX IF NOT EXISTS idx_job_listings_created_at ON public.job_listings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_applications_listing_id ON public.job_applications(listing_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_id ON public.job_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);

-- Enable Row Level Security
ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_listings
-- Allow public read access for active listings
CREATE POLICY "Public can view active job listings" 
ON public.job_listings FOR SELECT 
USING (is_active = true);

-- Allow authenticated users to read all listings
CREATE POLICY "Authenticated users can read job listings" 
ON public.job_listings FOR SELECT 
TO authenticated
USING (true);

-- Allow club owners to create listings
CREATE POLICY "Club owners can create job listings" 
ON public.job_listings FOR INSERT 
TO authenticated
WITH CHECK (
    club_id IN (
        SELECT id FROM public.clubs 
        WHERE id = club_id
    )
);

-- Allow club owners to update their own listings
CREATE POLICY "Club owners can update their job listings" 
ON public.job_listings FOR UPDATE 
TO authenticated
USING (
    club_id IN (
        SELECT id FROM public.club_members 
        WHERE club_id = job_listings.club_id 
        AND user_id = auth.uid()
        AND role = 'admin'
    )
);

-- Allow club owners to delete their own listings
CREATE POLICY "Club owners can delete their job listings" 
ON public.job_listings FOR DELETE 
TO authenticated
USING (
    club_id IN (
        SELECT id FROM public.club_members 
        WHERE club_id = job_listings.club_id 
        AND user_id = auth.uid()
        AND role = 'admin'
    )
);

-- RLS Policies for job_applications
-- Allow applicants to view their own applications
CREATE POLICY "Users can view their own applications" 
ON public.job_applications FOR SELECT 
TO authenticated
USING (applicant_id = auth.uid());

-- Allow club owners to view applications for their listings
CREATE POLICY "Club owners can view applications for their listings" 
ON public.job_applications FOR SELECT 
TO authenticated
USING (
    listing_id IN (
        SELECT id FROM public.job_listings
        WHERE club_id IN (
            SELECT club_id FROM public.club_members 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    )
);

-- Allow authenticated users to create applications
CREATE POLICY "Authenticated users can create applications" 
ON public.job_applications FOR INSERT 
TO authenticated
WITH CHECK (applicant_id = auth.uid());

-- Allow club owners to update application status
CREATE POLICY "Club owners can update application status" 
ON public.job_applications FOR UPDATE 
TO authenticated
USING (
    listing_id IN (
        SELECT id FROM public.job_listings
        WHERE club_id IN (
            SELECT club_id FROM public.club_members 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    )
);

-- Allow users to delete their own applications
CREATE POLICY "Users can delete their own applications" 
ON public.job_applications FOR DELETE 
TO authenticated
USING (applicant_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_job_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_job_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER job_listings_updated_at
    BEFORE UPDATE ON public.job_listings
    FOR EACH ROW
    EXECUTE FUNCTION update_job_listings_updated_at();

CREATE TRIGGER job_applications_updated_at
    BEFORE UPDATE ON public.job_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_job_applications_updated_at();

-- Create function to increment applications_count
CREATE OR REPLACE FUNCTION increment_job_applications_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.job_listings
    SET applications_count = applications_count + 1
    WHERE id = NEW.listing_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_applications_count
    AFTER INSERT ON public.job_applications
    FOR EACH ROW
    EXECUTE FUNCTION increment_job_applications_count();
