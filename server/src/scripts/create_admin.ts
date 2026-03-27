import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aryn0x';

const createAdmin = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB.');

        const adminEmail = 'admin@aryn0x.com';
        const adminPass = 'ArynoxAdmin123!';
        
        const existing = await User.findOne({ email: adminEmail });
        if (existing) {
            existing.role = 'admin';
            existing.onboardingComplete = true;
            await existing.save();
            console.log(`User ${adminEmail} promoted to Admin.`);
        } else {
            const hashed = await bcrypt.hash(adminPass, 12);
            const admin = new User({
                email: adminEmail,
                password: hashed,
                name: 'System Admin',
                role: 'admin',
                onboardingComplete: true,
                department: 'Administration',
                googleId: 'internal-admin-seed' // unique placeholder to satisfy constraint
            });
            await admin.save();
            console.log(`Admin account created: ${adminEmail}`);
            console.log(`Email: ${adminEmail}`);
            console.log(`Password: ${adminPass}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();
