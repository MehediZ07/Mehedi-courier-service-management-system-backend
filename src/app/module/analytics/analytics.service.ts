import { prisma } from '../../lib/prisma.js';

const trackVisit = async (data: { ip?: string; userAgent?: string; userId?: string; userEmail?: string; userName?: string; userRole?: string; page?: string }) => {
  return await prisma.visit.create({ data });
};

const getAnalytics = async () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);

  const [totalVisits, todayVisits, liveUsers, recentVisits] = await Promise.all([
    prisma.visit.count(),
    prisma.visit.count({ where: { createdAt: { gte: today } } }),
    prisma.visit.groupBy({ by: ['userId'], where: { createdAt: { gte: fiveMinAgo }, userId: { not: null } }, _count: true }),
    prisma.visit.findMany({ orderBy: { createdAt: 'desc' }, take: 50, select: { id: true, ip: true, userAgent: true, userId: true, userEmail: true, userName: true, userRole: true, page: true, createdAt: true } })
  ]);

  return { totalVisits, todayVisits, liveUsers: liveUsers.length, recentVisits };
};

const getAllVisits = async (query: any) => {
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', searchTerm, userRole } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {};
  
  if (searchTerm) {
    where.OR = [
      { userName: { contains: searchTerm, mode: 'insensitive' } },
      { userEmail: { contains: searchTerm, mode: 'insensitive' } },
      { ip: { contains: searchTerm, mode: 'insensitive' } },
    ];
  }
  
  if (userRole) {
    where.userRole = userRole === 'GUEST' ? null : userRole;
  }

  const [visits, total] = await Promise.all([
    prisma.visit.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: Number(limit),
      select: { id: true, ip: true, userAgent: true, userId: true, userEmail: true, userName: true, userRole: true, page: true, createdAt: true }
    }),
    prisma.visit.count({ where })
  ]);

  return {
    data: visits,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }
  };
};

export const AnalyticsService = { trackVisit, getAnalytics, getAllVisits };
