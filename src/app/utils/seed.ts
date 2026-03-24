import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { envVars } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { jwtUtils } from '../utils/jwt.js';

export const seedSuperAdmin = async () => {
  try {
    const exists = await prisma.user.findFirst({ where: { role: Role.SUPER_ADMIN } });

    if (exists) {
      console.log('Super admin already exists. Skipping seed.');
      return;
    }

    const hashedPassword = await bcrypt.hash(envVars.SUPER_ADMIN_PASSWORD, 12);

    const superAdmin = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: envVars.SUPER_ADMIN_EMAIL,
        password: hashedPassword,
        role: Role.SUPER_ADMIN,
      },
    });

    console.log('Super Admin created:', superAdmin.email);
  } catch (error) {
    console.error('Error seeding super admin:', error);
  }
};
