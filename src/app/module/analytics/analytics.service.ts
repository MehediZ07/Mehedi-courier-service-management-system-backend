import { prisma } from '../../lib/prisma.js';

const trackVisit = async (data: { 
  sessionId?: string; 
  isNewSession?: boolean;
  visitedPages?: string[];
  ip?: string; 
  userAgent?: string; 
  userId?: string; 
  userEmail?: string; 
  userName?: string; 
  userRole?: string; 
  page?: string 
}) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const currentHour = now.getHours();
    const userRole = data.userRole || 'GUEST';
    
    // Generate sessionId if not provided
    const sessionId = data.sessionId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // 1. Increment aggregated page view counter (upsert)
    await prisma.pageViewStat.upsert({
      where: {
        page_date_hour_userRole: {
          page: data.page || 'unknown',
          date: today,
          hour: currentHour,
          userRole: userRole,
        },
      },
      update: {
        viewCount: { increment: 1 },
      },
      create: {
        page: data.page || 'unknown',
        date: today,
        hour: currentHour,
        userRole: userRole,
        viewCount: 1,
      },
    });
    
    // 2. Track unique daily visitor (only once per session per day)
    await prisma.dailyVisitor.upsert({
      where: { sessionId },
      update: {
        pages: data.visitedPages || [data.page || 'unknown'],
      },
      create: {
        sessionId,
        userId: data.userId,
        userEmail: data.userEmail,
        userName: data.userName,
        userRole: userRole,
        date: today,
        pages: data.visitedPages || [data.page || 'unknown'],
        ip: data.ip,
        userAgent: data.userAgent,
      },
    });
    
    // 3. Keep recent visits for "live users" tracking (last 7 days only)
    // Store every visit with sessionId for activity tracking
    await prisma.visit.create({ 
      data: {
        sessionId,
        ip: data.ip,
        userAgent: data.userAgent,
        userId: data.userId,
        userEmail: data.userEmail,
        userName: data.userName,
        userRole: userRole,
        page: data.page,
      }
    });
    
    // Auto-cleanup: Delete visits older than 7 days (runs on every 100th request)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (Math.random() < 0.01) {
      prisma.visit.deleteMany({
        where: { createdAt: { lt: sevenDaysAgo } },
      }).catch(() => {}); // Fire and forget
    }
  } catch (error) {
    console.error('Analytics tracking error:', error);
    // Silently fail - don't break the app if analytics tables don't exist
  }
};

const getAnalytics = async () => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const [totalPageViews, todayPageViews, uniqueVisitorsToday, liveUsers, recentVisits] = await Promise.all([
      // Total page views from aggregated stats
      prisma.pageViewStat.aggregate({
        _sum: { viewCount: true },
      }),
      // Today's page views
      prisma.pageViewStat.aggregate({
        where: { date: today },
        _sum: { viewCount: true },
      }),
      // Unique visitors today
      prisma.dailyVisitor.count({
        where: { date: today },
      }),
      // Live users (from recent Visit records)
      prisma.visit.groupBy({ 
        by: ['userId'], 
        where: { 
          createdAt: { gte: fiveMinAgo }, 
          userId: { not: null } 
        }, 
        _count: true 
      }),
      // Recent visits (last 50 from Visit table)
      prisma.visit.findMany({ 
        orderBy: { createdAt: 'desc' }, 
        take: 50, 
        select: { 
          id: true, 
          sessionId: true,
          ip: true, 
          userAgent: true, 
          userId: true, 
          userEmail: true, 
          userName: true, 
          userRole: true, 
          page: true, 
          createdAt: true 
        } 
      })
    ]);

    return { 
      totalVisits: totalPageViews._sum.viewCount || 0,
      todayVisits: todayPageViews._sum.viewCount || 0,
      uniqueVisitorsToday: uniqueVisitorsToday,
      liveUsers: liveUsers.length, 
      recentVisits 
    };
  } catch (error) {
    console.error('Analytics fetch error:', error);
    // Return empty data if tables don't exist
    return { 
      totalVisits: 0,
      todayVisits: 0,
      uniqueVisitorsToday: 0,
      liveUsers: 0, 
      recentVisits: [] 
    };
  }
};

const getAllVisits = async (query: any) => {
  try {
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
        select: { 
          id: true, 
          sessionId: true,
          ip: true, 
          userAgent: true, 
          userId: true, 
          userEmail: true, 
          userName: true, 
          userRole: true, 
          page: true, 
          createdAt: true 
        }
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
  } catch (error) {
    console.error('Get all visits error:', error);
    return {
      data: [],
      meta: {
        total: 0,
        page: Number(query.page || 1),
        limit: Number(query.limit || 10),
        totalPages: 0
      }
    };
  }
};

const getPageStats = async (query: any) => {
  try {
    const { days = 7 } = query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));
    startDate.setHours(0, 0, 0, 0);

    const stats = await prisma.pageViewStat.findMany({
      where: {
        date: { gte: startDate },
      },
      orderBy: [
        { date: 'desc' },
        { hour: 'desc' },
      ],
    });

    return stats;
  } catch (error) {
    console.error('Get page stats error:', error);
    return [];
  }
};

export const AnalyticsService = { trackVisit, getAnalytics, getAllVisits, getPageStats };
