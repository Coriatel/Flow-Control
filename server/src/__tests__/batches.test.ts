import request from 'supertest';
import app from '../app';
import { prisma } from '../utils/prisma';

describe('Batches Endpoints', () => {
  let authToken: string;
  let testSupplierId: string;
  let testReagentId: string;
  let testBatchId: string;

  beforeAll(async () => {
    // Create test user
    const user = await globalThis.testHelpers.createTestUser();
    authToken = globalThis.testHelpers.generateToken(user.id, 'ADMIN');

    // Create test supplier
    const supplier = await prisma.supplier.create({
      data: {
        name: 'Batch Test Supplier',
        email: 'batch-supplier@test.com',
        isActive: true
      }
    });
    testSupplierId = supplier.id;

    // Create test reagent
    const reagent = await prisma.reagent.create({
      data: {
        name: 'Batch Test Reagent',
        catalogNumber: 'BATCH-TEST-001',
        category: 'REAGENT',
        supplierId: testSupplierId,
        currentStock: 0,
        minimumStock: 10
      }
    });
    testReagentId = reagent.id;
  });

  afterAll(async () => {
    await globalThis.testHelpers.cleanupTestData();
  });

  describe('POST /api/batches', () => {
    it('should create a new batch in ACTIVE status', async () => {
      const expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now

      const response = await request(app)
        .post('/api/batches')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reagentId: testReagentId,
          lotNumber: 'LOT-TEST-001',
          quantity: 100,
          receivedDate: new Date().toISOString(),
          expiryDate: expiryDate.toISOString(),
          manufacturer: 'Test Manufacturer',
          storageLocation: 'Refrigerator A1'
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.lotNumber).toBe('LOT-TEST-001');
      expect(response.body.data.status).toBe('ACTIVE');
      expect(response.body.data.quantity).toBe(100);
      expect(response.body.data.currentQuantity).toBe(100);
      testBatchId = response.body.data.id;
    });

    it('should reject duplicate lot number for same reagent', async () => {
      const expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

      const response = await request(app)
        .post('/api/batches')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reagentId: testReagentId,
          lotNumber: 'LOT-TEST-001', // Duplicate
          quantity: 50,
          receivedDate: new Date().toISOString(),
          expiryDate: expiryDate.toISOString()
        })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', false);
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });

    it('should reject batch with past expiry date', async () => {
      const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

      const response = await request(app)
        .post('/api/batches')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reagentId: testReagentId,
          lotNumber: 'LOT-EXPIRED',
          quantity: 50,
          receivedDate: new Date().toISOString(),
          expiryDate: pastDate.toISOString()
        })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', false);
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });

    it('should reject without authentication', async () => {
      const response = await request(app)
        .post('/api/batches')
        .send({
          reagentId: testReagentId,
          lotNumber: 'LOT-UNAUTH',
          quantity: 10,
          expiryDate: new Date().toISOString()
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/batches', () => {
    it('should return list of batches', async () => {
      const response = await request(app)
        .get('/api/batches')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter by reagent', async () => {
      const response = await request(app)
        .get(`/api/batches?reagentId=${testReagentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      response.body.data.forEach((batch: any) => {
        expect(batch.reagentId).toBe(testReagentId);
      });
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/batches?status=ACTIVE')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      response.body.data.forEach((batch: any) => {
        expect(batch.status).toBe('ACTIVE');
      });
    });

    it('should filter batches expiring soon', async () => {
      // Create a batch expiring in 15 days
      const soonDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
      await prisma.reagentBatch.create({
        data: {
          reagentId: testReagentId,
          lotNumber: 'LOT-EXPIRING-SOON',
          quantity: 50,
          currentQuantity: 50,
          receivedDate: new Date(),
          expiryDate: soonDate,
          status: 'ACTIVE'
        }
      });

      const response = await request(app)
        .get('/api/batches?expiringSoon=true&days=30')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      const expiringSoonBatch = response.body.data.find(
        (b: any) => b.lotNumber === 'LOT-EXPIRING-SOON'
      );
      expect(expiringSoonBatch).toBeDefined();
    });
  });

  describe('GET /api/batches/:id', () => {
    it('should return batch by ID', async () => {
      const response = await request(app)
        .get(`/api/batches/${testBatchId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.id).toBe(testBatchId);
      expect(response.body.data.lotNumber).toBe('LOT-TEST-001');
    });

    it('should return 404 for non-existent batch', async () => {
      const response = await request(app)
        .get('/api/batches/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('PUT /api/batches/:id', () => {
    it('should update batch details', async () => {
      const response = await request(app)
        .put(`/api/batches/${testBatchId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          storageLocation: 'Refrigerator B2',
          notes: 'Moved to new location'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.storageLocation).toBe('Refrigerator B2');
      expect(response.body.data.notes).toBe('Moved to new location');
    });

    it('should not allow updating lot number', async () => {
      const response = await request(app)
        .put(`/api/batches/${testBatchId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          lotNumber: 'NEW-LOT-NUMBER'
        })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', false);
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });

    it('should not allow updating quantity directly', async () => {
      const response = await request(app)
        .put(`/api/batches/${testBatchId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentQuantity: 50
        })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', false);
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/batches/:id/withdraw', () => {
    let withdrawableBatch: any;

    beforeEach(async () => {
      // Create a fresh batch for withdrawal tests
      withdrawableBatch = await prisma.reagentBatch.create({
        data: {
          reagentId: testReagentId,
          lotNumber: `LOT-WITHDRAW-${Date.now()}`,
          quantity: 100,
          currentQuantity: 100,
          receivedDate: new Date(),
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: 'ACTIVE'
        }
      });
    });

    it('should withdraw from batch and reduce quantity', async () => {
      const response = await request(app)
        .post(`/api/batches/${withdrawableBatch.id}/withdraw`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 10,
          reason: 'Testing withdrawal'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.currentQuantity).toBe(90); // 100 - 10
      expect(response.body.data.status).toBe('ACTIVE');
    });

    it('should mark batch as CONSUMED when fully withdrawn', async () => {
      const response = await request(app)
        .post(`/api/batches/${withdrawableBatch.id}/withdraw`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 100, // Withdraw all
          reason: 'Full withdrawal'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.currentQuantity).toBe(0);
      expect(response.body.data.status).toBe('CONSUMED');
    });

    it('should reject withdrawal exceeding available quantity', async () => {
      const response = await request(app)
        .post(`/api/batches/${withdrawableBatch.id}/withdraw`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 150, // More than available (100)
          reason: 'Excessive withdrawal'
        })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', false);
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });

    it('should reject withdrawal from EXPIRED batch', async () => {
      // Create expired batch
      const expiredBatch = await prisma.reagentBatch.create({
        data: {
          reagentId: testReagentId,
          lotNumber: `LOT-EXPIRED-${Date.now()}`,
          quantity: 100,
          currentQuantity: 100,
          receivedDate: new Date(),
          expiryDate: new Date(Date.now() - 1),
          status: 'EXPIRED'
        }
      });

      const response = await request(app)
        .post(`/api/batches/${expiredBatch.id}/withdraw`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 10,
          reason: 'Invalid withdrawal'
        })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', false);
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });

    it('should create inventory transaction on withdrawal', async () => {
      await request(app)
        .post(`/api/batches/${withdrawableBatch.id}/withdraw`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 5,
          reason: 'Transaction test'
        });

      const transactions = await prisma.inventoryTransaction.findMany({
        where: {
          batchId: withdrawableBatch.id,
          type: 'WITHDRAWAL'
        }
      });

      expect(transactions.length).toBeGreaterThan(0);
      expect(transactions[0].quantity).toBe(-5); // Negative for withdrawal
    });
  });

  describe('POST /api/batches/:id/adjust', () => {
    it('should adjust batch quantity', async () => {
      const adjustableBatch = await prisma.reagentBatch.create({
        data: {
          reagentId: testReagentId,
          lotNumber: `LOT-ADJUST-${Date.now()}`,
          quantity: 100,
          currentQuantity: 100,
          receivedDate: new Date(),
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: 'ACTIVE'
        }
      });

      const response = await request(app)
        .post(`/api/batches/${adjustableBatch.id}/adjust`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          newQuantity: 95,
          reason: 'Inventory count adjustment'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.currentQuantity).toBe(95);
    });

    it('should require admin role for adjustment', async () => {
      const userToken = globalThis.testHelpers.generateToken('user-1', 'USER');

      const response = await request(app)
        .post(`/api/batches/${testBatchId}/adjust`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          newQuantity: 50,
          reason: 'Unauthorized adjustment'
        })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', false);
      expect(response.statusCode).toBeGreaterThanOrEqual(403);
    });
  });

  describe('POST /api/batches/:id/hold', () => {
    it('should put batch on hold', async () => {
      const response = await request(app)
        .post(`/api/batches/${testBatchId}/hold`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'Quality control review'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.status).toBe('ON_HOLD');
      expect(response.body.data.notes).toContain('Quality control review');
    });

    it('should prevent withdrawal from batch on hold', async () => {
      const heldBatch = await prisma.reagentBatch.create({
        data: {
          reagentId: testReagentId,
          lotNumber: `LOT-HELD-${Date.now()}`,
          quantity: 100,
          currentQuantity: 100,
          receivedDate: new Date(),
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: 'ON_HOLD'
        }
      });

      const response = await request(app)
        .post(`/api/batches/${heldBatch.id}/withdraw`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 10,
          reason: 'Invalid withdrawal'
        })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', false);
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/batches/:id/release', () => {
    it('should release batch from hold', async () => {
      const heldBatch = await prisma.reagentBatch.create({
        data: {
          reagentId: testReagentId,
          lotNumber: `LOT-RELEASE-${Date.now()}`,
          quantity: 100,
          currentQuantity: 100,
          receivedDate: new Date(),
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: 'ON_HOLD'
        }
      });

      const response = await request(app)
        .post(`/api/batches/${heldBatch.id}/release`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'QC passed'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.status).toBe('ACTIVE');
    });
  });

  describe('POST /api/batches/:id/destroy', () => {
    it('should mark batch as destroyed', async () => {
      const destroyableBatch = await prisma.reagentBatch.create({
        data: {
          reagentId: testReagentId,
          lotNumber: `LOT-DESTROY-${Date.now()}`,
          quantity: 50,
          currentQuantity: 50,
          receivedDate: new Date(),
          expiryDate: new Date(Date.now() - 1), // Expired
          status: 'EXPIRED'
        }
      });

      const response = await request(app)
        .post(`/api/batches/${destroyableBatch.id}/destroy`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'Expired batch disposal',
          destroyedBy: 'admin-user'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.status).toBe('DESTROYED');
      expect(response.body.data.currentQuantity).toBe(0);
    });

    it('should require reason for destruction', async () => {
      const response = await request(app)
        .post(`/api/batches/${testBatchId}/destroy`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          destroyedBy: 'admin-user'
          // Missing reason
        })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', false);
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Batch Expiry Checks', () => {
    it('should automatically mark expired batches', async () => {
      const expiredBatch = await prisma.reagentBatch.create({
        data: {
          reagentId: testReagentId,
          lotNumber: `LOT-AUTO-EXPIRE-${Date.now()}`,
          quantity: 100,
          currentQuantity: 100,
          receivedDate: new Date(),
          expiryDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
          status: 'ACTIVE'
        }
      });

      // Trigger expiry check
      const response = await request(app)
        .post('/api/batches/check-expiries')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      // Verify batch is now expired
      const updatedBatch = await prisma.reagentBatch.findUnique({
        where: { id: expiredBatch.id }
      });
      expect(updatedBatch?.status).toBe('EXPIRED');
    });

    it('should create alerts for batches expiring soon', async () => {
      const soonToExpireBatch = await prisma.reagentBatch.create({
        data: {
          reagentId: testReagentId,
          lotNumber: `LOT-ALERT-${Date.now()}`,
          quantity: 100,
          currentQuantity: 100,
          receivedDate: new Date(),
          expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          status: 'ACTIVE'
        }
      });

      // Trigger expiry check
      await request(app)
        .post('/api/batches/check-expiries')
        .set('Authorization', `Bearer ${authToken}`);

      // Check for alert
      const alerts = await prisma.activeAlert.findMany({
        where: {
          type: 'EXPIRING_SOON',
          relatedId: soonToExpireBatch.id
        }
      });

      expect(alerts.length).toBeGreaterThan(0);
    });
  });
});
