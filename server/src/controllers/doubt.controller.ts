import { Request, Response } from 'express';
import Doubt from '../models/Doubt';
import User from '../models/User';
import DocumentMeta from '../models/DocumentMeta';
import { notifyStudent, notifyTeacher } from './notifications.controller';

/**
 * Ask a doubt about a specific subject/module.
 */
export const createDoubt = async (req: Request, res: Response): Promise<void> => {
    try {
        const studentId = req.user?.userId;
        const { subject, module, question } = req.body;

        const student = await User.findById(studentId);
        if (!student) {
            res.status(404).json({ error: 'Student not found' });
            return;
        }

        // 🏫 ROBUST FACULTY LOOKUP
        let assignedTeacherId: any = null;

        const subjectExpert = await User.findOne({ 
            role: 'teacher', 
            department: student.department, 
            subjects: { $in: [new RegExp(subject, 'i')] } 
        });

        if (subjectExpert) {
            assignedTeacherId = subjectExpert._id;
        } else {
            const doc = await DocumentMeta.findOne({ 
                subject: new RegExp(subject, 'i'), 
                department: student.department,
                teacherId: { $exists: true }
            }).sort({ uploadedAt: -1 });

            if (doc && doc.teacherId) {
                assignedTeacherId = doc.teacherId;
            } else {
                const deptFaculty = await User.findOne({ 
                    role: 'teacher', 
                    department: student.department 
                });
                
                if (deptFaculty) {
                    assignedTeacherId = deptFaculty._id;
                } else {
                    const anyTeacher = await User.findOne({ role: 'teacher' });
                    if (anyTeacher) {
                        assignedTeacherId = anyTeacher._id;
                    }
                }
            }
        }

        if (!assignedTeacherId) {
            res.status(404).json({ error: 'No faculty members available' });
            return;
        }

        const doubt = new Doubt({
            studentId,
            studentName: student.name,
            teacherId: assignedTeacherId,
            subject,
            module: module || 'Inquiry',
            question,
            status: 'pending'
        });

        await doubt.save();

        // Notify Teacher
        notifyTeacher(assignedTeacherId.toString(), {
            type: 'STUDENT_DOUBT',
            question: doubt.question,
            studentName: student.name
        });

        res.status(201).json({ message: 'Doubt sent successfully!', doubt });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send doubt' });
    }
};

/**
 * Resolve a doubt with an answer.
 */
export const resolveDoubt = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { answer } = req.body;

        const doubt = await Doubt.findById(id);
        if (!doubt) {
            res.status(404).json({ error: 'Doubt not found' });
            return;
        }

        doubt.answer = answer;
        doubt.status = 'resolved';
        await doubt.save();

        // Notify Student
        notifyStudent(doubt.studentId.toString(), {
            type: 'TEACHER_REPLY',
            topic: doubt.question,
            answer: doubt.answer
        });

        res.status(200).json({ message: 'Resolved!', doubt });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};

export const getTeacherDoubts = async (req: Request, res: Response): Promise<void> => {
    try {
        const teacherId = req.user?.userId;
        const doubts = await Doubt.find({ teacherId }).sort({ createdAt: -1 });
        res.status(200).json(doubts);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};

export const getStudentDoubts = async (req: Request, res: Response): Promise<void> => {
    try {
        const studentId = req.user?.userId;
        const doubts = await Doubt.find({ studentId }).sort({ createdAt: -1 });
        res.status(200).json(doubts);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};
