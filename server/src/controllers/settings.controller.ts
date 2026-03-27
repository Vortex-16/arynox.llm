import { Request, Response, NextFunction } from 'express';
import SystemSetting from '../models/SystemSetting';

export const getSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { department } = req.query;
        const settings = await SystemSetting.findOne({ department: (department as string) || 'General' });
        
        if (!settings) {
            // Return defaults if none exist
            res.status(200).json({
                department: department || 'General',
                isExamMode: false,
                aiStrictness: 'SOCRATIC',
                confidenceThreshold: 0.45
            });
            return;
        }
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
};

export const updateSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { department, isExamMode, aiStrictness, confidenceThreshold } = req.body;
        
        const settings = await SystemSetting.findOneAndUpdate(
            { department: department || 'General' },
            { isExamMode, aiStrictness, confidenceThreshold },
            { upsert: true, new: true }
        );
        
        res.status(200).json({ message: 'Settings updated successfully', settings });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update settings' });
    }
};
