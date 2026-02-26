const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase credentials missing in .env')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function saveToSupabase(data) {
    try {
        // 1. Insert into resumes table
        const { data: resume, error: resumeError } = await supabase
            .from('resumes')
            .insert([{
                candidate_name: data.candidateName,
                email: data.email,
                phone: data.phone,
                location: data.location,
                linkedin: data.linkedin,
                github: data.github,
                total_experience: data.totalExperience,
                overall_score: data.overallScore,
                ats_score: data.atsScore,
                keyword_score: data.keywordScore,
                skills_score: data.skillsScore,
                experience_score: data.experienceScore,
                education_score: data.educationScore,
                format_score: data.formatScore,
                word_count: data.wordCount,
                char_count: data.charCount
            }])
            .select()

        if (resumeError) throw resumeError
        const resumeId = resume[0].id

        // 2. Insert Skills
        if (data.skills && data.skills.length > 0) {
            const skillInserts = data.skills.map(s => ({
                resume_id: resumeId,
                skill_name: s.name,
                skill_type: s.type
            }))
            await supabase.from('resume_skills').insert(skillInserts)
        }

        // 3. Insert Experience
        if (data.experience && data.experience.length > 0) {
            const expInserts = data.experience.map(e => ({
                resume_id: resumeId,
                job_title: e.title,
                company: e.company,
                duration: e.duration,
                description: e.bullets.join('\n')
            }))
            await supabase.from('resume_experience').insert(expInserts)
        }

        // 4. Insert Education
        if (data.education && data.education.length > 0) {
            const eduInserts = data.education.map(e => ({
                resume_id: resumeId,
                degree: e.degree,
                institution: e.institution,
                passing_year: e.year,
                gpa: e.gpa
            }))
            await supabase.from('resume_education').insert(eduInserts)
        }

        // 5. Insert Insights
        const insightInserts = []
        if (data.strengths) data.strengths.forEach(s => insightInserts.push({ resume_id: resumeId, insight_type: 'strength', content: s }))
        if (data.weaknesses) data.weaknesses.forEach(w => insightInserts.push({ resume_id: resumeId, insight_type: 'weakness', content: w }))
        if (data.redFlags) data.redFlags.forEach(r => insightInserts.push({ resume_id: resumeId, insight_type: 'red_flag', content: r }))
        if (data.suggestions) data.suggestions.forEach(s => insightInserts.push({ resume_id: resumeId, insight_type: 'suggestion', content: s.title + ': ' + s.description, priority: s.priority }))

        if (insightInserts.length > 0) {
            await supabase.from('resume_insights').insert(insightInserts)
        }

        // 6. Insert Job Matches
        if (data.jobRoleMatches && data.jobRoleMatches.length > 0) {
            const jobInserts = data.jobRoleMatches.slice(0, 5).map(j => ({
                resume_id: resumeId,
                job_title: j.title,
                match_percentage: j.match,
                category: j.category
            }))
            await supabase.from('job_matches').insert(jobInserts)
        }

        return { success: true, resumeId }
    } catch (err) {
        console.error('❌ Supabase Save Error:', {
            message: err.message,
            code: err.code,
            details: err.details,
            hint: err.hint
        })
        return { success: false, error: err.message }
    }
}

module.exports = { supabase, saveToSupabase }
