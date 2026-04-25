import { prisma } from '../src/app/lib/prisma.js';

/**
 * Cleanup old visit records - keeps only last 7 days
 * Auto-aggregation happens in real-time via trackVisit
 */

const cleanupOldVisits = async () => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Delete old Visit records (raw data)
    const visitResult = await prisma.visit.deleteMany({
      where: { createdAt: { lt: sevenDaysAgo } },
    });

    console.log(`✅ Deleted ${visitResult.count} old Visit records (>7 days)`);
    
    // Delete old DailyVisitor records (>90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const visitorResult = await prisma.dailyVisitor.deleteMany({
      where: { date: { lt: ninetyDaysAgo } },
    });

    console.log(`✅ Deleted ${visitorResult.count} old DailyVisitor records (>90 days)`);
    
    // Delete old PageViewStat records (>365 days)
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);
    
    const statsResult = await prisma.pageViewStat.deleteMany({
      where: { date: { lt: oneYearAgo } },
    });

    console.log(`✅ Deleted ${statsResult.count} old PageViewStat records (>365 days)`);
    
    // Get current stats
    const [totalVisits, totalPageViews, totalVisitors] = await Promise.all([
      prisma.visit.count(),
      prisma.pageViewStat.aggregate({ _sum: { viewCount: true } }),
      prisma.dailyVisitor.count(),
    ]);

    console.log(`\n📊 Current database stats:`);
    console.log(`   Visit records (last 7 days): ${totalVisits}`);
    console.log(`   Total page views (aggregated): ${totalPageViews._sum.viewCount || 0}`);
    console.log(`   Unique visitors (last 90 days): ${totalVisitors}`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error cleaning up:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

cleanupOldVisits();
