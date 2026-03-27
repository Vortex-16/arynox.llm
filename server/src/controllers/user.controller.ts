import { Request, Response } from 'express';
import User from '../models/User';

/**
 * Get all students in a teacher's department.
 */
export const getStudentsByDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { department } = req.query;
        if (!department) {
            res.status(400).json({ error: 'Department is required to filter students.' });
            return;
        }

        const students = await User.find({ 
            role: 'student', 
            department: department.toString() 
        }).select('+email'); // Assuming email might be needed for management

        res.status(200).json(students);
    } catch (error) {
        console.error("Get Students Error:", error);
        res.status(500).json({ error: 'Failed to retrieve students.' });
    }
};

/**
 * Update student academic metadata (className, semester).
 */
export const updateStudent = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { className, semester, department, name } = req.body;

        const student = await User.findById(id);
        if (!student || student.role !== 'student') {
            res.status(404).json({ error: 'Student not found' });
            return;
        }

        if (className) student.className = className;
        if (semester) student.semester = semester;
        if (department) student.department = department;
        if (name) student.name = name;

        await student.save();
        res.status(200).json({ message: 'Student updated successfully', student });
    } catch (error) {
        console.error("Update Student Error:", error);
        res.status(500).json({ error: 'Failed to update student' });
    }
};

/**
 * Delete a student user.
 */
export const deleteStudent = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const student = await User.findById(id);

        if (!student || student.role !== 'student') {
            res.status(404).json({ error: 'Student not found' });
            return;
        }

        await student.deleteOne();
        res.status(200).json({ message: 'Student deleted successfully' });
    } catch (error) {
        console.error("Delete Student Error:", error);
        res.status(500).json({ error: 'Failed to delete student' });
    }
};
/**
 * Update the authenticated user's profile metadata. (Student or Teacher)
 */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { name, className, semester, department, subjects, semesters, classYears } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        if (name) user.name = name;
        if (department) user.department = department;

        if (user.role === 'student') {
            if (className) user.className = className;
            if (semester)  user.semester  = semester;
        } else if (user.role === 'teacher') {
            if (subjects)   user.subjects   = subjects;
            if (semesters)  user.semesters  = semesters;
            if (classYears) user.classYears = classYears;
        }

        await user.save();
        res.status(200).json({ message: 'Profile updated successfully', user });
    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

/**
 * Get all registered faculty. (Admin Only)
 */
export const getFaculty = async (req: Request, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'admin') {
            res.status(403).json({ error: 'Unauthorized. Admin access required.' });
            return;
        }
        const faculty = await User.find({ role: 'teacher' }).sort({ createdAt: -1 });
        res.status(200).json(faculty);
    } catch (error) {
        console.error("Get Faculty Error:", error);
        res.status(500).json({ error: 'Failed to retrieve faculty registry.' });
    }
};

/**
 * Administrative update of faculty metadata. (Admin Only)
 */
export const updateFaculty = async (req: Request, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'admin') {
            res.status(403).json({ error: 'Unauthorized. Admin access required.' });
            return;
        }
        const { id } = req.params;
        const { name, department, subjects, semesters, classYears } = req.body;

        const teacher = await User.findById(id);
        if (!teacher || teacher.role !== 'teacher') {
            res.status(404).json({ error: 'Faculty member not found' });
            return;
        }

        if (name)       teacher.name       = name;
        if (department) teacher.department = department;
        if (subjects)   teacher.subjects   = subjects;
        if (semesters)  teacher.semesters  = semesters;
        if (classYears) teacher.classYears = classYears;

        await teacher.save();
        res.status(200).json({ message: 'Faculty updated successfully', teacher });
    } catch (error) {
        console.error("Update Faculty Error:", error);
        res.status(500).json({ error: 'Failed to update faculty' });
    }
};

/**
 * Administrative deletion of faculty. (Admin Only)
 */
export const deleteFaculty = async (req: Request, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'admin') {
            res.status(403).json({ error: 'Unauthorized. Admin access required.' });
            return;
        }
        const { id } = req.params;
        const teacher = await User.findById(id);
        if (!teacher || teacher.role !== 'teacher') {
            res.status(404).json({ error: 'Faculty member not found' });
            return;
        }

        await teacher.deleteOne();
        res.status(200).json({ message: 'Faculty member removed successfully' });
    } catch (error) {
        console.error("Delete Faculty Error:", error);
        res.status(500).json({ error: 'Failed to remove faculty member' });
    }
};
