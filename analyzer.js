const fs = require('fs')
const path = require('path')
// pdf-parse has a CJS export quirk — handle both direct function and .default wrapped exports
const _pdfParseModule = require('pdf-parse')
const pdfParse = typeof _pdfParseModule === 'function' ? _pdfParseModule : (_pdfParseModule.default || _pdfParseModule)
const mammoth = require('mammoth')

// ─── Text Extraction ─────────────────────────────────────────────────────────

async function extractText(filePath, mimeType) {
    if (mimeType === 'application/pdf') {
        const buffer = fs.readFileSync(filePath)
        const data = await pdfParse(buffer)
        return data.text || ''
    } else if (mimeType.includes('wordprocessingml') || mimeType.includes('msword')) {
        const result = await mammoth.extractRawText({ path: filePath })
        return result.value || ''
    }
    throw new Error('Unsupported file type')
}

// ─── NLP Helpers ─────────────────────────────────────────────────────────────

const TECHNICAL_SKILLS = [
    // Languages
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'ruby', 'rust', 'kotlin', 'swift', 'php', 'scala', 'dart', 'solidity',
    // Frontend
    'react', 'react.js', 'reactjs', 'angular', 'vue', 'vue.js', 'next.js', 'nuxt', 'svelte', 'solid.js', 'remix', 'htmx',
    'html', 'html5', 'css', 'css3', 'sass', 'scss', 'tailwind', 'bootstrap', 'material ui', 'mui', 'shadcn', 'ant design', 'framer motion',
    // Backend
    'node', 'node.js', 'nodejs', 'express', 'express.js', 'fastapi', 'flask', 'django', 'spring', 'spring boot', 'laravel', 'nest.js', 'asp.net', 'golang',
    // Databases
    'sql', 'mysql', 'postgresql', 'postgres', 'mongodb', 'mongo', 'redis', 'firebase', 'dynamodb', 'sqlite', 'elasticsearch', 'cassandra', 'prisma', 'typeorm', 'sequelize',
    // Infrastructure / DevOps
    'docker', 'kubernetes', 'k8s', 'aws', 'gcp', 'azure', 'terraform', 'ansible', 'jenkins', 'github actions', 'circleci', 'terraform', 'cloudformation',
    'ci/cd', 'devops', 'linux', 'bash', 'shell', 'nginx', 'apache', 'prometheus', 'grafana', 'terraform',
    // Mobile
    'react native', 'flutter', 'android', 'ios', 'swift', 'kotlin', 'objective-c', 'expo',
    // AI / Data
    'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'scikit-learn', 'nlp', 'pandas', 'numpy', 'data science', 'opencv', 'generative ai', 'llm', 'langchain',
    // Testing & Tools
    'jest', 'mocha', 'cypress', 'playwright', 'selenium', 'testing', 'unit testing', 'react testing library',
    'git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence', 'notion', 'postman', 'swagger', 'trello',
    'microservices', 'system design', 'agile', 'scrum', 'kanban', 'tdd', 'bdd', 'oop', 'mvc', 'rest api', 'graphql', 'grpc', 'websocket'
]

const SOFT_SKILLS = [
    'leadership', 'communication', 'teamwork', 'collaboration', 'problem solving', 'critical thinking',
    'time management', 'adaptability', 'creativity', 'attention to detail', 'project management',
    'mentoring', 'stakeholder management', 'presentation skills', 'active listening', 'conflict resolution',
    'emotional intelligence', 'public speaking', 'negotiation', 'decision making'
]

const POWER_WORDS = [
    'led', 'architected', 'designed', 'built', 'developed', 'engineered', 'created', 'launched', 'shipped',
    'optimized', 'improved', 'reduced', 'increased', 'grew', 'scaled', 'automated', 'streamlined',
    'delivered', 'managed', 'coordinated', 'mentored', 'trained', 'collaborated', 'implemented',
    'deployed', 'migrated', 'refactored', 'integrated', 'established', 'pioneered', 'spearheaded',
    'accelerated', 'transformed', 'negotiated', 'maximized', 'minimized', 'orchestrated'
]

const ATS_KEYWORDS = [
    'agile', 'scrum', 'kanban', 'ci/cd', 'rest api', 'microservices', 'cloud', 'aws', 'azure', 'gcp',
    'kubernetes', 'docker', 'git', 'typescript', 'javascript', 'python', 'react', 'node.js', 'sql',
    'leadership', 'communication', 'problem solving', 'data structures', 'algorithms', 'oop',
    'responsive design', 'version control', 'unit testing', 'code review', 'system design',
    'scalability', 'performance optimization', 'security', 'api design', 'deployment', 'monitoring'
]

function normalize(text) {
    return text.toLowerCase().replace(/[^\w\s.]/g, ' ')
}

function extractMatches(text, list) {
    const lower = normalize(text)
    // Use word boundaries for better matching and avoid sub-string matches like "java" in "javascript"
    return list.filter(item => {
        const escaped = item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(`\\b${escaped}\\b`, 'i')
        return regex.test(text) || lower.includes(item.toLowerCase())
    })
}

function extractMissing(text, list) {
    const matches = extractMatches(text, list)
    return list.filter(item => !matches.includes(item))
}

// ─── Section Parsers ──────────────────────────────────────────────────────────

function extractName(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    const commonSectionHeaders = ['about', 'contact', 'skills', 'experience', 'education', 'projects', 'summary']

    // Name is usually in the first few lines, not too long, no digits, no symbols
    for (let i = 0; i < Math.min(10, lines.length); i++) {
        const line = lines[i]
        const lower = line.toLowerCase()

        if (line.length > 2 && line.length < 40 &&
            !line.includes('@') && !line.includes('http') &&
            !/\d/.test(line) &&
            !line.endsWith('.') && // Names rarely end in a period
            !/resume|cv|curriculum vitae/i.test(line) &&
            !commonSectionHeaders.includes(lower)) {

            // Check if it looks like a name (Title Case or ALL CAPS)
            const isTitleCase = line.split(' ').every(word => /^[A-Z][a-z]*$|^[A-Z]+$/.test(word))
            const isAllCaps = line === line.toUpperCase() && /[A-Z]/.test(line)

            if (isTitleCase || isAllCaps) {
                return line
            }
        }
    }
    return 'Candidate'
}

function extractEmail(text) {
    const m = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)
    return m ? m[0] : null
}

function extractPhone(text) {
    // Look for 10-15 digit numbers with common separators, but don't bridge too many spaces
    const patterns = [
        /\+?\d{1,3}[\s\-]\d{10}/,           // +91 1234567890
        /\d{10}/,                            // 1234567890
        /\d{3}[\s\-]\d{3}[\s\-]\d{4}/,       // 123-456-7890
        /\(\d{3}\)[\s\-]?\d{3}[\s\-]\d{4}/  // (123) 456-7890
    ]

    for (const p of patterns) {
        const m = text.match(p)
        if (m) return m[0].trim()
    }

    // Fallback to a slightly more permissive but still bounded match
    const m = text.match(/(?:\+?\d{1,3}[\s\-]?)?\(?\d{2,4}\)?[\s\-]?\d{3,4}[\s\-]?\d{3,4}/)
    return m ? m[0].trim() : null
}

function extractLinkedIn(text) {
    const m = text.match(/linkedin\.com\/in\/[a-zA-Z0-9\-_./]+/i)
    return m ? m[0] : null
}

function extractGitHub(text) {
    const m = text.match(/github\.com\/[a-zA-Z0-9\-_]+/i)
    return m ? m[0] : null
}

function extractLocation(text) {
    const patterns = [
        /([A-Z][a-z]+(?: [A-Z][a-z]+)*,\s*[A-Z][a-z]+(?: [A-Z][a-z]+)*)/,
        /([A-Z][a-z]+(?: [A-Z][a-z]+)*,\s*[A-Z]{2,3})/,
        /\b(?:Mumbai|Pune|Bangalore|Bengaluru|Delhi|Hyderabad|Chennai|Kolkata|London|New York|San Francisco|Berlin|Tokyo)\b/i
    ]
    for (const p of patterns) {
        const m = text.match(p)
        if (m) return m[1] || m[0]
    }
    return null
}

function estimateExperience(text) {
    const matches = text.matchAll(/(\d+)[\s\-\+]*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)/gi)
    const years = [...matches].map(m => parseInt(m[1]))
    if (years.length > 0) return `${Math.max(...years)}+ Years`

    const datePatterns = text.matchAll(/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s,.]+\d{4}/gi)
    const dates = [...datePatterns].length
    if (dates >= 6) return '5+ Years'
    if (dates >= 4) return '3-5 Years'
    if (dates >= 2) return '1-3 Years'
    return 'Entry Level / Fresher'
}

function extractExperience(text) {
    const experiences = []
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    const datePattern = /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s,.]+\d{4}/gi

    let currentExp = null
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const hasDate = datePattern.test(line)
        datePattern.lastIndex = 0

        if (hasDate) {
            if (currentExp) experiences.push(currentExp)
            currentExp = {
                title: lines[i - 1] && lines[i - 1].length < 60 ? lines[i - 1] : 'Professional Role',
                company: line,
                duration: extractDuration(line),
                bullets: []
            }
        } else if (currentExp && (line.startsWith('•') || line.startsWith('-') || line.startsWith('*') || line.length > 30)) {
            currentExp.bullets.push(line.replace(/^[•\-*]\s*/, ''))
        }
    }
    if (currentExp) experiences.push(currentExp)

    return experiences.slice(0, 5)
}

function extractDuration(line) {
    const m = line.match(/(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s,]+\d{4})\s*[-–—to]+\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s,]+\d{4}|present|current)/i)
    return m ? m[0] : 'Duration not specified'
}

function extractEducation(text) {
    const degrees = ['b.tech', 'b.e.', 'bachelor', 'm.tech', 'm.e.', 'master', 'mba', 'bca', 'mca', 'b.sc', 'm.sc', 'phd', 'doctoral', 'intermediate', 'hsc', 'ssc']
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    const education = []

    for (let i = 0; i < lines.length; i++) {
        const lower = lines[i].toLowerCase()
        if (degrees.some(d => lower.includes(d))) {
            const yearMatch = lines[i].match(/\b(19|20)\d{2}\b/)
            education.push({
                degree: lines[i],
                institution: lines[i + 1] && lines[i + 1].length < 100 ? lines[i + 1] : 'Academic Institution',
                year: yearMatch ? yearMatch[0] : 'Year not found',
                gpa: (text.slice(text.indexOf(lines[i])).match(/(?:gpa|cgpa|grade)[\s:]*(\d+\.?\d*)/i) || [])[1]
            })
        }
    }
    return education.slice(0, 3)
}

// ─── Scoring Engine ───────────────────────────────────────────────────────────

function calculateScores(text, matchedKeywords, matchedSkills, jobDesc) {
    const wordCount = text.split(/\s+/).length

    // ATS score: base analysis of signals
    const signals = ['email', 'phone', 'experience', 'education', 'skills', 'projects', 'summary', 'languages', 'certifications', 'hobbies']
    const hits = signals.filter(s => text.toLowerCase().includes(s)).length
    const atsScore = Math.min(100, 40 + hits * 6 + (wordCount > 400 ? 5 : 0) + (wordCount < 1000 ? 5 : 0))

    // Keyword score: relative to target if JD provided
    let keywordScore = 0
    if (jobDesc) {
        const jdKeywords = extractMatches(jobDesc, [...TECHNICAL_SKILLS, ...ATS_KEYWORDS])
        const jdOverlap = jdKeywords.filter(kw => text.toLowerCase().includes(kw.toLowerCase()))
        keywordScore = Math.round((jdOverlap.length / Math.max(jdKeywords.length, 1)) * 100)
    } else {
        keywordScore = Math.min(100, Math.round((matchedKeywords.length / 25) * 100))
    }
    keywordScore = Math.max(keywordScore, 40) // Floor

    // Skills score
    const skillsScore = Math.min(100, 35 + matchedSkills.length * 4)

    // Experience score
    const bullets = (text.match(/•|^\s*[-*]/gm) || []).length
    const achievements = (text.match(/\d+%|\$\d+|\d+\+|\d+ (?:million|users|customers|team members)/gi) || []).length
    const experienceScore = Math.min(100, 45 + Math.min(bullets, 15) * 2 + achievements * 5)

    // Education score
    const eduScore = /m\.tech|master|mba|phd/i.test(text) ? 95 : /bachelor|degree/i.test(text) ? 85 : 65

    // Format score
    const contactHits = (text.match(/email|phone|linkedin|github|address/gi) || []).length
    const sectionHits = (text.match(/experience|education|skills|projects|summary/gi) || []).length
    const formatScore = Math.min(100, 50 + contactHits * 10 + sectionHits * 5)

    const overall = Math.round((atsScore * 0.25) + (keywordScore * 0.2) + (skillsScore * 0.2) + (experienceScore * 0.15) + (eduScore * 0.1) + (formatScore * 0.1))

    return { overallScore: overall, atsScore, keywordScore, skillsScore, experienceScore, educationScore: eduScore, formatScore }
}

// ─── Suggestions Generator ────────────────────────────────────────────────────

function generateSuggestions(text, missingKeywords, missingSkills, scores) {
    const suggestions = []

    if (scores.keywordScore < 75) {
        suggestions.push({
            icon: '🔑',
            title: 'Optimize Core Keywords',
            description: `Your resume is missing some critical industry keywords: ${missingKeywords.slice(0, 3).join(', ')}. ATS systems use these to rank candidates.`,
            priority: 'high',
            example: `Inject them naturally in your "Experience" or "About" section rather than just listing them.`
        })
    }

    if (!(text.match(/\d+%/g) || []).length) {
        suggestions.push({
            icon: '📊',
            title: 'Add Quantifiable Results',
            description: 'Recruiters and AI look for impact. You haven\'t mentioned percentages or specific metrics of success.',
            priority: 'high',
            example: 'Change "Improved application speed" to "Optimized API response times by 40%, reducing latency for 10k+ daily users."'
        })
    }

    if (!/github|portfolio|linkedin/i.test(text)) {
        suggestions.push({
            icon: '🔗',
            title: 'Missing Social Proof',
            description: 'Provide links to your GitHub or Portfolio to allow recruiters to see your code and projects directly.',
            priority: 'medium',
            example: 'GitHub: github.com/yourusername | Portfolio: yourname.dev'
        })
    }

    if (missingSkills.length > 5) {
        suggestions.push({
            icon: '🚀',
            title: 'Bridge the Skills Gap',
            description: `Commonly paired skills like ${missingSkills.slice(0, 3).join(', ')} were not detected. Consider highlighting these if you have experience with them.`,
            priority: 'medium',
            example: 'Add these to a "Technical Skills" table organized by category.'
        })
    }

    if (text.length < 500) {
        suggestions.push({
            icon: '📄',
            title: 'Resume is Too Short',
            description: 'Your resume seems very brief. It might be missing important context or project details that ATS checks for.',
            priority: 'high',
            example: 'Expand on your project responsibilities and the specific technologies used in each role.'
        })
    }

    return suggestions
}

// ─── Job Role Matching ────────────────────────────────────────────────────────

const JOB_ROLES = [
    { title: 'Frontend Developer', category: 'Web', keywords: ['react', 'javascript', 'typescript', 'html', 'css', 'tailwind', 'redux', 'next.js'] },
    { title: 'Backend Developer', category: 'Engineering', keywords: ['node.js', 'express', 'python', 'sql', 'mongodb', 'api', 'microservices', 'aws'] },
    { title: 'Full Stack Engineer', category: 'Software', keywords: ['react', 'node', 'javascript', 'sql', 'git', 'api', 'docker', 'css'] },
    { title: 'Data Scientist', category: 'Data', keywords: ['python', 'machine learning', 'sql', 'pandas', 'nlp', 'statistics', 'numpy', 'pytorch'] },
    { title: 'DevOps Engineer', category: 'Cloud', keywords: ['docker', 'kubernetes', 'aws', 'ci/cd', 'terraform', 'linux', 'jenkins', 'ansible'] },
    { title: 'Mobile App Developer', category: 'Mobile', keywords: ['react native', 'flutter', 'swift', 'kotlin', 'ios', 'android', 'api', 'mobile'] },
    { title: 'Software Architect', category: 'Architecture', keywords: ['system design', 'scalability', 'microservices', 'cloud', 'aws', 'docker', 'security'] },
    { title: 'Product Manager', category: 'Management', keywords: ['roadmap', 'agile', 'stakeholders', 'ux', 'market', 'product', 'strategy', 'metrics'] }
]

function matchJobRoles(text) {
    const lower = text.toLowerCase()
    return JOB_ROLES.map(role => {
        const matched = role.keywords.filter(kw => lower.includes(kw.toLowerCase()))
        const matchPct = Math.round((matched.length / role.keywords.length) * 100)
        const missing = role.keywords.filter(kw => !lower.includes(kw.toLowerCase())).slice(0, 3)
        return { title: role.title, category: role.category, match: Math.max(matchPct, 20), missingFor: missing }
    }).sort((a, b) => b.match - a.match)
}

// ─── Main Analyzer ────────────────────────────────────────────────────────────

async function analyzeResume(filePath, mimeType, { jobTitle = '', jobDescription = '' } = {}) {
    const text = await extractText(filePath, mimeType)

    if (!text || text.trim().length < 50) {
        throw new Error('Could not extract readable text. Ensure document is not a scanned image.')
    }

    // Extraction
    const candidateName = extractName(text)
    const email = extractEmail(text)
    const phone = extractPhone(text)
    const linkedin = extractLinkedIn(text)
    const github = extractGitHub(text)
    const location = extractLocation(text)
    const totalExperience = estimateExperience(text)

    // Skill Analysis
    const matchedSkills = extractMatches(text, TECHNICAL_SKILLS)
    const missingSkills = extractMissing(text, TECHNICAL_SKILLS).slice(0, 15)
    const matchedKeywords = extractMatches(text, ATS_KEYWORDS)
    const missingKeywords = extractMissing(text, ATS_KEYWORDS)
    const powerWords = extractMatches(text, POWER_WORDS)
    const softSkills = extractMatches(text, SOFT_SKILLS).map(s => s.charAt(0).toUpperCase() + s.slice(1))

    // Job specific boosting
    const scores = calculateScores(text, matchedKeywords, matchedSkills, jobDescription)

    // Sections
    const experience = extractExperience(text)
    const education = extractEducation(text)

    // Logic for strengths/weaknesses
    const strengths = []
    const weaknesses = []
    const redFlags = []

    if (matchedSkills.length > 8) strengths.push('Extensive technical toolkit detected')
    if (powerWords.length > 5) strengths.push('Uses high-impact industry action verbs')
    if (text.match(/\d+%/g)) strengths.push('Results-oriented with quantified metrics')
    if (experience.length >= 3) strengths.push('Broad professional background')
    if (linkedin && github) strengths.push('Strong professional online presence')
    if (strengths.length === 0) strengths.push('Correctly formatted resume sections')

    if (missingKeywords.length > 15) weaknesses.push('Missing significant volume of ATS-preferred keywords')
    if (matchedSkills.length < 5) weaknesses.push('Technical skill list is relatively narrow')
    if (!linkedin) weaknesses.push('LinkedIn profile not found')
    if (text.length > 5000) redFlags.push('Resume is excessively long — consider condensing')
    if (text.length < 400) redFlags.push('Resume is critically short — lacks depth')
    if (!email && !phone) redFlags.push('No contact information identified')

    const suggestions = generateSuggestions(text, missingKeywords, missingSkills, scores)
    const jobRoleMatches = matchJobRoles(text)

    return {
        ...scores,
        candidateName,
        email,
        phone,
        location,
        linkedin,
        github,
        totalExperience,
        matchedKeywords: matchedKeywords.map(k => k.charAt(0).toUpperCase() + k.slice(1)),
        missingKeywords: missingKeywords.map(k => k.charAt(0).toUpperCase() + k.slice(1)).slice(0, 20),
        powerWords: powerWords.map(k => k.charAt(0).toUpperCase() + k.slice(1)),
        skills: matchedSkills.map(s => ({ name: s.charAt(0).toUpperCase() + s.slice(1), type: 'technical' })),
        softSkills,
        missingSkills: missingSkills.map(k => k.charAt(0).toUpperCase() + k.slice(1)),
        experience,
        education,
        strengths,
        weaknesses,
        redFlags,
        suggestions,
        jobRoleMatches,
        wordCount: text.split(/\s+/).length,
        charCount: text.length
    }
}

module.exports = { analyzeResume }

