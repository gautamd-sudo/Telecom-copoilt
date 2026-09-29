import { app } from './src/api/server';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

async function run() {
  const prisma = new PrismaClient();
  const token = 'perf-test-token';
  
  console.log("Measuring Baseline (100 reqs):");
  let start = Date.now();
  for(let i=0; i<100; i++) {
    await request(app).get('/api/v1/incidents?status=OPEN').set('Authorization', 'Bearer ' + token);
  }
  console.log(`Baseline Latency: ${(Date.now() - start)/100} ms/req`);
  
  console.log("\nSimulating Redis Cache...");
  const fakeCache = new Map();
  // Override incident route temporarily for test
  app.get('/api/v1/incidents_cached', async (req, res) => {
    if (fakeCache.has('open_incidents')) {
      return res.status(200).json(fakeCache.get('open_incidents'));
    }
    const incidents = await prisma.incident.findMany({ where: { status: 'OPEN' }, take: 50 });
    fakeCache.set('open_incidents', { status: 'success', data: incidents });
    res.status(200).json({ status: 'success', data: incidents });
  });

  start = Date.now();
  for(let i=0; i<100; i++) {
    await request(app).get('/api/v1/incidents_cached').set('Authorization', 'Bearer ' + token);
  }
  console.log(`Cached Latency: ${(Date.now() - start)/100} ms/req`);
  
  process.exit(0);
}
run();
