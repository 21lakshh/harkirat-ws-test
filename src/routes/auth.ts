import { Router } from "express";
import { AuthMiddleware } from "../middlewares/Authmiddleware.js";
import z from "zod";
import bcrypt from "bcryptjs";
import prisma from "../client.js";
import jwt from "jsonwebtoken";
import { Role } from "@/generated/prisma/index.js";

const SingnupSchema = z.object({
  name: z.string(),
  email: z.string(),
  password: z.string().min(6),
  role: z.string(),
});

const SigninSchema = z.object({
  email: z.string(),
  password: z.string(),
});

const AuthRouter = Router();

AuthRouter.post("/signup", async (req, res) => {
  const SignupBody = await req.body;
  const parsedBody = SingnupSchema.safeParse(SignupBody);

  if (!parsedBody.success) {
    return res.status(400).json({
      success: false,
      error: "Invalid Signup Body",
    });
  }

  const { name, email, password, role } = parsedBody.data;

  const existingUser = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: "Email already exists",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await prisma.user.create({
    data: {
      name: name,
      email: email,
      password: hashedPassword,
      role: role as Role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  return res.status(201).json({
    succuess: true,
    data: {
      id: result.id,
      name: result.name,
      email: result.email,
      role: result.role,
    },
  });
});

AuthRouter.post("/login", async (req, res) => {
  const loginBody = await req.body;
  const parsedloginBody = SigninSchema.safeParse(loginBody);

  if (!parsedloginBody.success) {
    return res.status(400).json({
      success: false,
      error: "Invalid Login Body",
    });
  }

  const { email, password } = parsedloginBody.data;

  const existingUser = await prisma.user.findUnique({
    where: {
      email: email,
    },
    select: {
      id: true,
      password: true,
      role: true,
    },
  });

  if (!existingUser) {
    return res.status(400).json({
      success: false,
      error: "Invalid email or password",
    });
  }

  const verifyPassword = bcrypt.compareSync(password, existingUser.password);

  if (!verifyPassword) {
    return res.status(400).json({
      success: false,
      error: "Invalid email or password",
    });
  }

  const JWT_SECRET = process.env.JWT_SECRET || "lakshya";

  const jwtToken = jwt.sign(
    { userId: existingUser.id, role: existingUser.role },
    JWT_SECRET
  );

  return res.status(200).json({
    success: true,
    data: {
      token: jwtToken,
    },
  });
});

AuthRouter.get("/me", AuthMiddleware, async (req, res) => {
  const userId = req.user?.userId;
  const role = req.user?.role;

  if (!userId || !role) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    }
  });

  if (!user) {
    return res.status(404).json({ success: false, error: "User not found" });
  }

  return res.status(200).json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }
  })
});

export default AuthRouter;
