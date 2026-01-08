import request from 'supertest';
import app from '../app';
import { prisma } from '../utils/prisma';

describe('Reagents Endpoints', () => {
  let authToken: string;
  let testSupplierId: string;
  let testReagentId: string;

  beforeAll(async () => {
    // Create test user and supplier
    const user = await globalThis.testHelpers.createTestUser();
    authToken = globalThis.testHelpers.generateToken(user.id, 'ADMIN');

    const supplier = await prisma.supplier.create({
      data: {
        name: 'Reagent Test Supplier',
        email: 'reagent-supplier@test.com',
        isActive: true
      }
    });
    testSupplierId = supplier.id;
  });

  afterAll(async () => {
    await globalThis.testHelpers.cleanupTestData();
  });

  describe('POST /api/reagents', () => {
    it('should create a new reagent', async () => {
      const response = await request(app)
        .post('/api/reagents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Anti-A Test Reagent',
          catalogNumber: 'TEST-AA-001',
          category: 'REAGENT',
          supplierId: testSupplierId,
          currentStock: 0,
          minimumStock: 10,
          reorderPoint: 20,
          unitOfMeasurement: 'vials',
          storageConditions: '2-8°C'
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('Anti-A Test Reagent');
      expect(response.body.data.catalogNumber).toBe('TEST-AA-001');
      expect(response.body.data.category).toBe('REAGENT');
      testReagentId = response.body.data.id;
    });

    it('should reject duplicate catalog number', async () => {
      const response = await request(app)
        .post('/api/reagents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Duplicate Reagent',
          catalogNumber: 'TEST-AA-001', // Same as above
          category: 'REAGENT',
          supplierId: testSupplierId
        })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', false);
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });

    it('should reject invalid category', async () => {
      const response = await request(app)
        .post('/api/reagents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid Category Reagent',
          catalogNumber: 'TEST-INVALID',
          category: 'INVALID_CATEGORY',
          supplierId: testSupplierId
        })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', false);
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });

    it('should reject without authentication', async () => {
      const response = await request(app)
        .post('/api/reagents')
        .send({
          name: 'Unauthorized Reagent',
          catalogNumber: 'TEST-UNAUTH',
          category: 'REAGENT',
          supplierId: testSupplierId
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/reagents', () => {
    it('should return list of reagents', async () => {
      const response = await request(app)
        .get('/api/reagents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/reagents?category=REAGENT')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      response.body.data.forEach((reagent: any) => {
        expect(reagent.category).toBe('REAGENT');
      });
    });

    it('should filter by supplier', async () => {
      const response = await request(app)
        .get(`/api/reagents?supplierId=${testSupplierId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      response.body.data.forEach((reagent: any) => {
        expect(reagent.supplierId).toBe(testSupplierId);
      });
    });

    it('should filter by low stock', async () => {
      // First, create a reagent with low stock
      const lowStockReagent = await prisma.reagent.create({
        data: {
          name: 'Low Stock Reagent',
          catalogNumber: 'TEST-LOW-STOCK',
          category: 'REAGENT',
          supplierId: testSupplierId,
          currentStock: 5,
          minimumStock: 10,
          reorderPoint: 20
        }
      });

      const response = await request(app)
        .get('/api/reagents?stockStatus=LOW')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      const lowStockItem = response.body.data.find((r: any) => r.id === lowStockReagent.id);
      expect(lowStockItem).toBeDefined();
    });
  });

  describe('GET /api/reagents/:id', () => {
    it('should return reagent by ID', async () => {
      const response = await request(app)
        .get(`/api/reagents/${testReagentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.id).toBe(testReagentId);
      expect(response.body.data.name).toBe('Anti-A Test Reagent');
    });

    it('should return 404 for non-existent reagent', async () => {
      const response = await request(app)
        .get('/api/reagents/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('PUT /api/reagents/:id', () => {
    it('should update reagent', async () => {
      const response = await request(app)
        .put(`/api/reagents/${testReagentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Anti-A Test Reagent Updated',
          minimumStock: 15,
          reorderPoint: 25
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.name).toBe('Anti-A Test Reagent Updated');
      expect(response.body.data.minimumStock).toBe(15);
      expect(response.body.data.reorderPoint).toBe(25);
    });

    it('should not allow updating to duplicate catalog number', async () => {
      // Create another reagent first
      const otherReagent = await prisma.reagent.create({
        data: {
          name: 'Other Reagent',
          catalogNumber: 'TEST-OTHER',
          category: 'REAGENT',
          supplierId: testSupplierId
        }
      });

      const response = await request(app)
        .put(`/api/reagents/${testReagentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          catalogNumber: 'TEST-OTHER' // Try to use existing catalog number
        })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', false);
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe('DELETE /api/reagents/:id', () => {
    it('should soft delete reagent', async () => {
      const response = await request(app)
        .delete(`/api/reagents/${testReagentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      // Verify it's marked as deleted
      const deletedReagent = await prisma.reagent.findUnique({
        where: { id: testReagentId }
      });
      expect(deletedReagent?.isDeleted).toBe(true);
    });

    it('should not allow deleting reagent with active batches', async () => {
      // Create reagent with active batch
      const reagent = await prisma.reagent.create({
        data: {
          name: 'Reagent with Batch',
          catalogNumber: 'TEST-WITH-BATCH',
          category: 'REAGENT',
          supplierId: testSupplierId
        }
      });

      await prisma.reagentBatch.create({
        data: {
          reagentId: reagent.id,
          lotNumber: 'LOT-123',
          quantity: 100,
          currentQuantity: 100,
          receivedDate: new Date(),
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: 'ACTIVE'
        }
      });

      const response = await request(app)
        .delete(`/api/reagents/${reagent.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', false);
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Stock Management', () => {
    it('should calculate correct stock status', async () => {
      // Create reagent with critical stock
      const criticalStockReagent = await prisma.reagent.create({
        data: {
          name: 'Critical Stock Reagent',
          catalogNumber: 'TEST-CRITICAL',
          category: 'REAGENT',
          supplierId: testSupplierId,
          currentStock: 2,
          minimumStock: 10,
          reorderPoint: 20
        }
      });

      const response = await request(app)
        .get(`/api/reagents/${criticalStockReagent.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.stockStatus).toBe('CRITICAL');
    });

    it('should list reagents needing reorder', async () => {
      const response = await request(app)
        .get('/api/reagents?needsReorder=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      response.body.data.forEach((reagent: any) => {
        expect(reagent.currentStock).toBeLessThanOrEqual(reagent.reorderPoint);
      });
    });
  });
});
