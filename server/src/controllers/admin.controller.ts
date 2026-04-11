import { Request, Response } from 'express';
import Department from '../models/Department';
import Subject from '../models/Subject';
import User from '../models/User';
import QueryLog from '../models/QueryLog';
import DocumentMeta from '../models/DocumentMeta';

// ─── DEPARTMENT CRUD ───────────────────────────────────────────────────────────

export const getDepartments = async (req: Request, res: Response): Promise<void> => {
    try {
        const depts = await Department.find({}).sort({ code: 1 });
        res.status(200).json(depts);
    } catch (err) {
        console.error('[Admin] getDepartments error:', err);
        res.status(500).json({ error: 'Failed to fetch departments.' });
    }
};

// Public version (no auth) — for onboarding dropdowns
export const getDepartmentsPublic = async (req: Request, res: Response): Promise<void> => {
    try {
        const depts = await Department.find({ isActive: true }, 'name code programs').sort({ code: 1 });
        res.status(200).json(depts);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch departments.' });
    }
};

export const createDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, code, programs, hodName, hodEmail } = req.body;
        if (!name || !code) {
            res.status(400).json({ error: 'Department name and code are required.' });
            return;
        }
        const existing = await Department.findOne({ code: code.toUpperCase() });
        if (existing) {
            res.status(409).json({ error: `Department code "${code.toUpperCase()}" already exists.` });
            return;
        }
        const dept = new Department({
            name,
            code: code.toUpperCase(),
            programs: programs || [],
            hodName,
            hodEmail,
            isActive: true
        });
        await dept.save();
        res.status(201).json({ message: 'Department created.', department: dept });
    } catch (err) {
        console.error('[Admin] createDepartment error:', err);
        res.status(500).json({ error: 'Failed to create department.' });
    }
};

export const updateDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
        const code = String(req.params.code);
        const { name, programs, hodName, hodEmail, isActive } = req.body;
        const dept = await Department.findOne({ code: code.toUpperCase() });
        if (!dept) {
            res.status(404).json({ error: 'Department not found.' });
            return;
        }
        if (name !== undefined) dept.name = name;
        if (programs !== undefined) dept.programs = programs;
        if (hodName !== undefined) dept.hodName = hodName;
        if (hodEmail !== undefined) dept.hodEmail = hodEmail;
        if (isActive !== undefined) dept.isActive = isActive;
        await dept.save();
        res.status(200).json({ message: 'Department updated.', department: dept });
    } catch (err) {
        console.error('[Admin] updateDepartment error:', err);
        res.status(500).json({ error: 'Failed to update department.' });
    }
};

export const deleteDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
        const code = String(req.params.code);
        const dept = await Department.findOne({ code: code.toUpperCase() });
        if (!dept) {
            res.status(404).json({ error: 'Department not found.' });
            return;
        }
        // Soft delete — keeps historical data intact
        dept.isActive = false;
        await dept.save();
        res.status(200).json({ message: 'Department deactivated (soft delete).' });
    } catch (err) {
        console.error('[Admin] deleteDepartment error:', err);
        res.status(500).json({ error: 'Failed to delete department.' });
    }
};

// ─── SUBJECT CRUD ──────────────────────────────────────────────────────────────

export const getSubjects = async (req: Request, res: Response): Promise<void> => {
    try {
        const { departmentCode, program, semester } = req.query;
        const filter: any = { isActive: true };
        if (departmentCode) filter.departmentCode = String(departmentCode).toUpperCase();
        if (program) filter.program = String(program);
        if (semester) filter.semester = parseInt(String(semester), 10);
        const subjects = await Subject.find(filter).sort({ semester: 1, name: 1 });
        res.status(200).json(subjects);
    } catch (err) {
        console.error('[Admin] getSubjects error:', err);
        res.status(500).json({ error: 'Failed to fetch subjects.' });
    }
};

export const createSubject = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, code, departmentCode, program, semester, credits } = req.body;
        if (!name || !code || !departmentCode || !program || !semester) {
            res.status(400).json({ error: 'name, code, departmentCode, program, and semester are all required.' });
            return;
        }
        // Verify the department exists
        const dept = await Department.findOne({ code: departmentCode.toUpperCase() });
        if (!dept) {
            res.status(404).json({ error: `Department "${departmentCode}" does not exist. Create it first.` });
            return;
        }
        const subject = new Subject({
            name,
            code: code.toUpperCase(),
            departmentCode: departmentCode.toUpperCase(),
            program,
            semester: parseInt(semester, 10),
            credits,
            isActive: true
        });
        await subject.save();
        res.status(201).json({ message: 'Subject created.', subject });
    } catch (err: any) {
        if (err.code === 11000) {
            res.status(409).json({ error: 'A subject with this code already exists in this department.' });
            return;
        }
        console.error('[Admin] createSubject error:', err);
        res.status(500).json({ error: 'Failed to create subject.' });
    }
};

export const updateSubject = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, credits, isActive } = req.body;
        const subject = await Subject.findById(id);
        if (!subject) {
            res.status(404).json({ error: 'Subject not found.' });
            return;
        }
        if (name !== undefined) subject.name = name;
        if (credits !== undefined) subject.credits = credits;
        if (isActive !== undefined) subject.isActive = isActive;
        await subject.save();
        res.status(200).json({ message: 'Subject updated.', subject });
    } catch (err) {
        console.error('[Admin] updateSubject error:', err);
        res.status(500).json({ error: 'Failed to update subject.' });
    }
};

export const assignTeacherToSubject = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { teacherId } = req.body;
        if (!teacherId) {
            res.status(400).json({ error: 'teacherId is required.' });
            return;
        }
        const teacher = await User.findById(teacherId);
        if (!teacher || teacher.role !== 'teacher') {
            res.status(404).json({ error: 'Teacher not found.' });
            return;
        }
        const subject = await Subject.findByIdAndUpdate(id, {
            assignedTeacherId: teacherId,
            assignedTeacherName: teacher.name
        }, { new: true });
        if (!subject) {
            res.status(404).json({ error: 'Subject not found.' });
            return;
        }
        res.status(200).json({ message: 'Teacher assigned.', subject });
    } catch (err) {
        console.error('[Admin] assignTeacher error:', err);
        res.status(500).json({ error: 'Failed to assign teacher.' });
    }
};

// ─── STUDENT SEMESTER MANAGEMENT ──────────────────────────────────────────────

export const promoteStudent = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { semester, className } = req.body;
        const student = await User.findById(id);
        if (!student || student.role !== 'student') {
            res.status(404).json({ error: 'Student not found.' });
            return;
        }
        if (semester) student.semester = semester;
        if (className) student.className = className;
        await student.save();
        res.status(200).json({ message: 'Student promoted.', student });
    } catch (err) {
        console.error('[Admin] promoteStudent error:', err);
        res.status(500).json({ error: 'Failed to promote student.' });
    }
};

export const bulkPromoteStudents = async (req: Request, res: Response): Promise<void> => {
    try {
        const { departmentCode, program, fromSemester, toSemester, fromClassName, toClassName } = req.body;
        if (!departmentCode || !fromSemester || !toSemester) {
            res.status(400).json({ error: 'departmentCode, fromSemester, and toSemester are required.' });
            return;
        }
        const filter: any = { role: 'student', department: departmentCode.toUpperCase(), semester: fromSemester };
        if (program) filter.program = program;
        if (fromClassName) filter.className = fromClassName;

        const update: any = { semester: toSemester };
        if (toClassName) update.className = toClassName;

        const result = await User.updateMany(filter, { $set: update });
        res.status(200).json({ 
            message: `Promoted ${result.modifiedCount} students from ${fromSemester} to ${toSemester}.`,
            modifiedCount: result.modifiedCount 
        });
    } catch (err) {
        console.error('[Admin] bulkPromote error:', err);
        res.status(500).json({ error: 'Failed to bulk promote students.' });
    }
};

// ─── UNIVERSITY OVERVIEW STATS ─────────────────────────────────────────────────

export const getAdminStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const [totalQueries, totalStudents, totalTeachers, totalDocs, totalDepts, totalSubjects] = await Promise.all([
            QueryLog.countDocuments(),
            User.countDocuments({ role: 'student' }),
            User.countDocuments({ role: 'teacher' }),
            DocumentMeta.countDocuments(),
            Department.countDocuments({ isActive: true }),
            Subject.countDocuments({ isActive: true }),
        ]);

        const deptActivity = await QueryLog.aggregate([
            { $group: { _id: '$department', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const subjectConfusion = await QueryLog.aggregate([
            { $match: { status: 'UNANSWERED_FORWARDED' } },
            { $group: { _id: '$subject', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        const recentUsers = await User.find({})
            .sort({ createdAt: -1 })
            .limit(10)
            .select('name email role department createdAt');

        res.status(200).json({
            stats: { totalQueries, totalStudents, totalTeachers, totalDocs, totalDepts, totalSubjects },
            deptActivity: deptActivity.map(d => ({ name: d._id || 'General', value: d.count })),
            subjectConfusion: subjectConfusion.map(s => ({ subject: s._id || 'General', count: s.count })),
            recentUsers
        });
    } catch (err) {
        console.error('[Admin] getAdminStats error:', err);
        res.status(500).json({ error: 'Failed to fetch admin stats.' });
    }
};

// ─── FACULTY MANAGEMENT ────────────────────────────────────────────────────────

export const getAllFaculty = async (req: Request, res: Response): Promise<void> => {
    try {
        const { departmentCode } = req.query;
        const filter: any = { role: 'teacher' };
        if (departmentCode) filter.department = (departmentCode as string).toUpperCase();
        const faculty = await User.find(filter).sort({ createdAt: -1 });
        res.status(200).json(faculty);
    } catch (err) {
        console.error('[Admin] getAllFaculty error:', err);
        res.status(500).json({ error: 'Failed to fetch faculty.' });
    }
};

export const getAllStudents = async (req: Request, res: Response): Promise<void> => {
    try {
        const { departmentCode, semester, program } = req.query;
        const filter: any = { role: 'student' };
        if (departmentCode) filter.department = String(departmentCode).toUpperCase();
        if (semester) filter.semester = String(semester);
        if (program) filter.program = String(program);
        const students = await User.find(filter).sort({ createdAt: -1 });
        res.status(200).json(students);
    } catch (err) {
        console.error('[Admin] getAllStudents error:', err);
        res.status(500).json({ error: 'Failed to fetch students.' });
    }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const target = await User.findById(id);
        if (!target) {
            res.status(404).json({ error: 'User not found.' });
            return;
        }
        if (target.role === 'admin') {
            res.status(403).json({ error: 'Cannot delete another admin account.' });
            return;
        }
        await target.deleteOne();
        res.status(200).json({ message: `${target.role === 'teacher' ? 'Faculty' : 'Student'} removed successfully.` });
    } catch (err) {
        console.error('[Admin] deleteUser error:', err);
        res.status(500).json({ error: 'Failed to delete user.' });
    }
};

// ─── SYSTEM SETTINGS ───────────────────────────────────────────────────────────

export const getSystemSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        const { dept } = req.query;
        const department = dept ? String(dept).toUpperCase() : 'GENERAL';
        let settings = await require('../models/SystemSetting').default.findOne({ department });
        
        if (!settings) {
            // Create default settings if none exist
            settings = new (require('../models/SystemSetting').default)({ department });
            await settings.save();
        }
        
        res.status(200).json(settings);
    } catch (err) {
        console.error('[Admin] getSystemSettings error:', err);
        res.status(500).json({ error: 'Failed to fetch settings.' });
    }
};

export const updateSystemSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        const { dept } = req.query;
        const department = dept ? String(dept).toUpperCase() : 'GENERAL';
        const { isExamMode, aiStrictness, confidenceThreshold } = req.body;
        
        let settings = await require('../models/SystemSetting').default.findOne({ department });
        if (!settings) {
            settings = new (require('../models/SystemSetting').default)({ department });
        }
        
        if (isExamMode !== undefined) settings.isExamMode = isExamMode;
        if (aiStrictness !== undefined) settings.aiStrictness = aiStrictness;
        if (confidenceThreshold !== undefined) settings.confidenceThreshold = confidenceThreshold;
        
        await settings.save();
        res.status(200).json({ message: 'Settings updated successfully.', settings });
    } catch (err) {
        console.error('[Admin] updateSystemSettings error:', err);
        res.status(500).json({ error: 'Failed to update settings.' });
    }
};
