import { Router } from "express";
import { AuthMiddleware } from "../middlewares/Authmiddleware.js";
import { RoleMiddleware } from "../middlewares/RoleMiddleware.js";
import prisma from "../client.js";
import { id } from "zod/locales";

const ClassRouter = Router();

ClassRouter.post("/", AuthMiddleware, RoleMiddleware(["teacher"]), async (req, res) => {
    const userId = req.user?.userId;
    const className = req.body;

    if (!className) {
        return res.status(400).json({
            success: false,
            error: "Class name is required"
        });
    }

    if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const result = await prisma.class.create({
        data: {
            className: className,
            teacherId: userId
        },
        select: {
            id: true,
            className: true,
            teacherId: true,
            students: true
        }
    });

    if (!result) {
        return res.status(500).json({
            success: false,
            error: "Failed to create class"
        });
    }

    res.status(201).json({
        success: true,
        data: {
            "id": result.id,
            "className": result.className,
            "teacherId": result.teacherId,
            "students": result.students
        }
    });
});

ClassRouter.post("/:id/add-student", AuthMiddleware, RoleMiddleware(["teacher"]), async (req, res) => {
    const classId: any = req.params.id;
    const { studentId } = req.body;
    const teacherId: any = req.user?.userId;

    if (!studentId) {
        return res.status(400).json({  
            success: false,
            error: "Student ID is required"
        });
    }

    if (!classId) {
        return res.status(400).json({  
            success: false,
            error: "Class ID is required"
        });
    }

    const existingClass = await prisma.class.findUnique({
        where: {
            id: classId,
            teacherId: teacherId
        },
        select: {
            students: true
        }
    });

    if (!existingClass) {
        return res.status(404).json({  
            success: false,
            error: "Class not found"
        });
    }

    const result = await prisma.class.update({
        where: {
            id: classId,
            teacherId: teacherId
        },
        data: {
            students: {
                connect: { id: studentId }
            }
        },
        select: {
            id: true,
            students: {
                select: {
                    id: true
                }
            },
            className: true,
            teacherId: true
        }
    });

    if (!result) {
        return res.status(500).json({
            success: false,
            error: "Failed to add student to class"
        });
    }

    res.status(200).json({
        success: true,
        data: {
            "id": result.id,
            "className": result.className,
            "teacherId": result.teacherId,
            "students": result.students.map(student => student.id)
        }
    });
});

ClassRouter.get("/:id", AuthMiddleware, RoleMiddleware(["teacher", "student"]), async (req, res) => {

    const classid: any = req.params.id;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!classid) {
        return res.status(400).json({
            success: false,
            error: "Class ID is required"
        });
    }

    if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const result = await prisma.class.findUnique({
        where: {
            id: classid
        },
        select: {
            id: true,
            className: true,
            teacherId: true,
            students: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                }
            }
        }
    });

    if (!result) {
        return res.status(404).json({
            success: false,
            error: "Class not found"
        });
    }

    if (userId !== result.teacherId && userRole === "teacher") {
        return res.status(403).json({
            success: false,
            error: "Forbidden"
        });
    }

    const isStudent = result.students.some(student => student.id === userId);

    if (userRole === "student" && !isStudent) {
        return res.status(403).json({
            success: false,
            error: "Forbidden"
        });
    }

    res.status(200).json({
        success: true,
        data: {
            id: result.id,
            className: result.className,
            teacherId: result.teacherId,
            students : result.students
        }
    });
});


ClassRouter.get("/students", AuthMiddleware, RoleMiddleware(["teacher"]), async (req, res) => {

    const teacherId: any = req.user?.userId;

    if (!teacherId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const result = await prisma.class.findMany({
        where: {
            
        },
        select: {
            students: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                }
            }
        }
    });

    if (!result) {
        return res.status(404).json({
            success: false,
            error: "No students found"
        });
    }

    const students = result
    .flatMap(cls => cls.students)
    .filter(
        (student, index, self) =>
        index === self.findIndex(s => s.id === student.id) // removing duplicates 
    );

    res.status(200).json({
        success: true,
        data: students
    });
});

ClassRouter.get("/:id/my-attendance", AuthMiddleware, RoleMiddleware(["student"]), async (req, res) => {

    const classId: any = req.params.id;
    const studentId: any = req.user?.userId;

    if (!classId) {
        return res.status(400).json({
            success: false,
            error: "Class ID is required"
        });
    }

    if (!studentId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const result = await prisma.attendance.findUnique({
        where: {
            classId_studentId: {
                classId: classId,
                studentId: studentId
            }
        },
        select: {
            id: true,
            status: true,
        }
    });

    if (!result) {
        return res.status(404).json({
            success: false,
            error: "Attendance record not found"
        });
    }

    if (result.status === null) {
        return res.status(200).json({
            success: true,
            data: {
                id: result.id,
                status: null
            }
        });
    } else {
        return res.status(200).json({
            success: true,
            data: {
                id: result.id,
                status: result.status
            }
        });
    }
});
export default ClassRouter;