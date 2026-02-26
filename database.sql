-- ResumeInsight Database Schema (PostgreSQL/Supabase Compatible)

-- 1. Main Resumes Table
CREATE TABLE IF NOT EXISTS resumes (
    id SERIAL PRIMARY KEY,
    candidate_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    location VARCHAR(255),
    linkedin VARCHAR(255),
    github VARCHAR(255),
    total_experience VARCHAR(100),
    
    -- Scoring
    overall_score INT,
    ats_score INT,
    keyword_score INT,
    skills_score INT,
    experience_score INT,
    education_score INT,
    format_score INT,
    
    -- Metadata
    word_count INT,
    char_count INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Skills Table
CREATE TABLE IF NOT EXISTS resume_skills (
    id SERIAL PRIMARY KEY,
    resume_id INT REFERENCES resumes(id) ON DELETE CASCADE,
    skill_name VARCHAR(100),
    skill_type VARCHAR(50) -- 'technical' or 'soft'
);

-- 3. Experience Table
CREATE TABLE IF NOT EXISTS resume_experience (
    id SERIAL PRIMARY KEY,
    resume_id INT REFERENCES resumes(id) ON DELETE CASCADE,
    job_title VARCHAR(255),
    company VARCHAR(255),
    duration VARCHAR(100),
    description TEXT -- Combined bullets or JSON
);

-- 4. Education Table
CREATE TABLE IF NOT EXISTS resume_education (
    id SERIAL PRIMARY KEY,
    resume_id INT REFERENCES resumes(id) ON DELETE CASCADE,
    degree VARCHAR(255),
    institution VARCHAR(255),
    passing_year VARCHAR(50),
    gpa VARCHAR(50)
);

-- 5. Analysis Insights (Strengths, Weaknesses, Red Flags)
CREATE TABLE IF NOT EXISTS resume_insights (
    id SERIAL PRIMARY KEY,
    resume_id INT REFERENCES resumes(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL, -- 'strength', 'weakness', 'red_flag', 'suggestion'
    content TEXT NOT NULL,
    priority VARCHAR(50) DEFAULT 'medium' -- For suggestions
);

-- 6. Job Matching
CREATE TABLE IF NOT EXISTS job_matches (
    id SERIAL PRIMARY KEY,
    resume_id INT REFERENCES resumes(id) ON DELETE CASCADE,
    job_title VARCHAR(255),
    match_percentage INT,
    category VARCHAR(100)
);
