import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './Route/index.js';
import os from "os";
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import morgan from 'morgan';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Allow all origins and methods
// server.ts - Update CORS configuration
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use("/uploads", cors(), express.static(path.join(__dirname, "../uploads")));
app.use(morgan('dev'));
const getLocalIP = (): string => {
  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] ?? []) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
};
const LOCAL_IP = getLocalIP();
app.use("/api", apiRouter);

// ─── APK Build Job Store (in-memory) ────────────────────────────────────────
type JobStatus = 'pending' | 'building' | 'success' | 'error';
interface ApkJob {
    status: JobStatus;
    apk_url?: string;
    error?: string;
    startedAt: Date;
}
const apkJobs = new Map<string, ApkJob>();

// POST /build-apk → kicks off build in background, returns jobId immediately
app.post('/build-apk', (req: Request, res: Response) => {
    const jobId = `apk-${Date.now()}`;
    const adminPath = path.resolve(__dirname, '../../Admin');
    const outputDir = path.resolve(__dirname, '../uploads/apk');
    const apkFileName = `app-release-${Date.now()}.apk`;

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Register job as pending straight away
    apkJobs.set(jobId, { status: 'pending', startedAt: new Date() });

    // Kick off build in background — don't await
    const buildCommand = `docker build -t admin-android-builder -f Dockerfile.android .`;
    const extractCommand = `docker run --rm -v "${outputDir}:/output" admin-android-builder cp /app/android/app/build/outputs/apk/release/app-release.apk /output/${apkFileName}`;

    apkJobs.set(jobId, { status: 'building', startedAt: new Date() });

    exec(buildCommand, { cwd: adminPath, maxBuffer: 1024 * 1024 * 50 }, (buildErr, _buildStdout, buildStderr) => {
        if (buildErr) {
            console.error('[APK Build] Docker build failed:', buildStderr || buildErr.message);
            apkJobs.set(jobId, { status: 'error', error: buildStderr || buildErr.message, startedAt: apkJobs.get(jobId)!.startedAt });
            return;
        }

        exec(extractCommand, { cwd: adminPath }, (extractErr, _extractStdout, extractStderr) => {
            if (extractErr) {
                console.error('[APK Build] APK extraction failed:', extractStderr || extractErr.message);
                apkJobs.set(jobId, { status: 'error', error: extractStderr || extractErr.message, startedAt: apkJobs.get(jobId)!.startedAt });
                return;
            }

            const apkUrl = `/uploads/apk/${apkFileName}`;
            console.log('[APK Build] Success:', apkUrl);
            apkJobs.set(jobId, { status: 'success', apk_url: apkUrl, startedAt: apkJobs.get(jobId)!.startedAt });
        });
    });

    // Return job ID immediately — client polls /build-apk/:jobId
    return res.status(202).json({ status: 'accepted', jobId, message: 'APK build started. Poll /build-apk/' + jobId + ' for progress.' });
});

// GET /build-apk/:jobId → poll for build status
app.get('/build-apk/:jobId', (req: Request, res: Response) => {
    const job = apkJobs.get(req.params.jobId as string);
    if (!job) {
        return res.status(404).json({ status: 'error', message: 'Job not found' });
    }
    return res.json({
        jobId: req.params.jobId,
        status: job.status,
        apk_url: job.apk_url,
        error: job.error,
        startedAt: job.startedAt,
    });
});


app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});

app.get('/', (req, res) => {
    res.json({ msg: 'Crackers POS with Billing API Server Running!' });
});



// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        msg: err.message || 'Server Error',
    });
});


const PORT = process.env.PORT || 5000;


const startServer = async () => {
    try {
        console.log('🔄 Initializing server...');
        
        const server = app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            if (process.env.NODE_ENV === "development") {
                console.log(`   ➜ Local:   http://localhost:${PORT}`); 

                if (LOCAL_IP !== "localhost") {
                    console.log(`   ➜ Network: http://${LOCAL_IP}:${PORT}`);
                }
            }
        });

        server.on('error', (err: any) => {
            console.error('❌ Server listen error:', err);
            process.exit(1);
        });

        // Prevention of automatic exit
        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        });

        process.on('uncaughtException', (err) => {
            console.error('Uncaught Exception thrown:', err);
            process.exit(1);
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
