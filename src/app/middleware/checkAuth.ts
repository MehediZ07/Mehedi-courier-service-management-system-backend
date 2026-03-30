import { NextFunction, Request, Response } from 'express';
import status from 'http-status';
import { Role, UserStatus } from '@prisma/client';
import AppError from '../errorHelpers/AppError.js';
import { prisma } from '../lib/prisma.js';
import { jwtUtils } from '../utils/jwt.js';
import { envVars } from '../config/env.js';

export const checkAuth = (...authRoles: Role[]) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check for token in Authorization header first
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // If no Authorization header, check cookies
      token = req.cookies?.accessToken;
    }

    if (!token) {
      throw new AppError(status.UNAUTHORIZED, 'Unauthorized! No token provided.');
    }

    const verified = jwtUtils.verifyToken(token, envVars.ACCESS_TOKEN_SECRET);

    if (!verified.success || !verified.data) {
      throw new AppError(status.UNAUTHORIZED, 'Unauthorized! Invalid or expired token.');
    }

    const user = await prisma.user.findUnique({ where: { id: verified.data.userId as string } });

    if (!user) {
      throw new AppError(status.UNAUTHORIZED, 'Unauthorized! User not found.');
    }

    if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.INACTIVE) {
      throw new AppError(status.FORBIDDEN, 'Your account is suspended or inactive.');
    }

    if (authRoles.length > 0 && !authRoles.includes(user.role)) {
      throw new AppError(status.FORBIDDEN, 'Forbidden! You do not have permission.');
    }

    req.user = { userId: user.id, role: user.role, email: user.email, name: user.name };

    next();
  } catch (error) {
    next(error);
  }
};
