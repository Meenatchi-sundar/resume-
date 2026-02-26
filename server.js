const express = require('express')
const multer = require('multer')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const { v4: uuidv4 } = require('uuid')
const { analyzeResume } = require('./analyzer')
const { saveToSupabase } = require('./supabase')

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'uploads')
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
        cb(null, dir)
    },
    filename: (req, file, cb) => {
        cb(null, `${uuidv4()}-${file.originalname}`)
    }
})

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        if (allowed.includes(file.mimetype)) {
            cb(null, true)
        } else {
            cb(new Error('Only PDF and DOCX files are allowed'))
        }
    }
})

// Analyze endpoint
app.post('/api/analyze', upload.single('resume'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' })
    }

    try {
        const filePath = req.file.path
        const mimeType = req.file.mimetype
        const jobTitle = req.body.jobTitle || ''
        const jobDescription = req.body.jobDescription || ''

        const result = await analyzeResume(filePath, mimeType, { jobTitle, jobDescription })

        // Save to Database (Supabase)
        const dbResult = await saveToSupabase(result)
        result.savedToDb = dbResult.success
        if (dbResult.success) result.dbId = dbResult.resumeId

        // Clean up uploaded file
        fs.unlink(filePath, () => { })

        res.json(result)
    } catch (err) {
        console.error('Analysis error:', err)
        res.status(500).json({ error: err.message || 'Analysis failed' })
    }
})

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '1.0.0' }))

app.listen(PORT, () => {
    console.log(`\n🚀 ResumeInsight Backend running on http://localhost:${PORT}\n`)
})
