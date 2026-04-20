afterAll(async () => {
  const [{ prisma }, queueModule] = await Promise.all([
    import('../src/shared/database/prisma.client'),
    import('../src/shared/queue/bull.queue')
  ]);

  if (prisma && typeof prisma.$disconnect === 'function') {
    await prisma.$disconnect();
  }

  if ('publishQueue' in queueModule && typeof queueModule.publishQueue.close === 'function') {
    await queueModule.publishQueue.close();
  }

  if ('contentGenQueue' in queueModule && typeof queueModule.contentGenQueue.close === 'function') {
    await queueModule.contentGenQueue.close();
  }
});
