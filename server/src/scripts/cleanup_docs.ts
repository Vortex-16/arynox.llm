import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import DocumentMeta from '../models/DocumentMeta';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/arynox';
const CHROMA_BASE = process.env.CHROMA_URL || 'http://localhost:8000';
const TENANT = process.env.CHROMA_TENANT || 'default_tenant';
const DATABASE = process.env.CHROMA_DATABASE || 'default_database';
const CHROMA_API_KEY = process.env.CHROMA_API_KEY;

const API_BASE = `${CHROMA_BASE}/api/v2/tenants/${TENANT}/databases/${DATABASE}/collections`;
const CHROMA_HEADERS = {
    'X-Chroma-Token': CHROMA_API_KEY,
    'Content-Type': 'application/json'
};

async function cleanup() {
    try {
        console.log('🧹 Starting Document & Vector Store Cleanup...');

        // 1. Clear MongoDB Document Meta
        if (MONGODB_URI) {
            await mongoose.connect(MONGODB_URI);
            console.log('✅ Connected to MongoDB');
            const deleteResult = await DocumentMeta.deleteMany({});
            console.log(`🗑️  Deleted ${deleteResult.deletedCount} DocumentMeta records from MongoDB.`);
        }

        // 2. Clear Local Uploads Directory
        const uploadsDir = path.join(process.cwd(), 'uploads');
        if (fs.existsSync(uploadsDir)) {
            const files = fs.readdirSync(uploadsDir);
            for (const file of files) {
                if (file !== '.gitkeep') {
                    try {
                        fs.unlinkSync(path.join(uploadsDir, file));
                    } catch (_) {}
                }
            }
            console.log(`🗑️  Cleaned ${files.length} files from uploads directory.`);
        }

        // 3. Purge Vector Collections in ChromaDB (if reachable)
        try {
            const res = await axios.get(API_BASE, { headers: CHROMA_HEADERS, timeout: 3000 });
            const collections: any[] = res.data || [];
            for (const col of collections) {
                try {
                    await axios.delete(`${API_BASE}/${col.id}`, { headers: CHROMA_HEADERS });
                    console.log(`🗑️  Deleted ChromaDB collection: "${col.name}"`);
                } catch (_) {}
            }
        } catch (e) {
            console.log('ℹ️  ChromaDB server not reachable or already clean.');
        }

        console.log('✨ Document reset complete! Pure clean state established.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Cleanup failed:', err);
        process.exit(1);
    }
}

cleanup();
