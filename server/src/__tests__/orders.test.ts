import request from 'supertest';
import app from '../app';
import { prisma } from '../utils/prisma';

describe('Orders Endpoints', () => {
  let authToken: string;
  let testSupplierId: string;
  let testReagentId: string;
  let testOrderId: string;

  beforeAll(async () => {
    // Create test user
    const user = await globalThis.testHelpers.createTestUser();
    authToken = globalThis.testHelpers.generateToken(user.id, 'ADMIN');

    // Create test supplier
    const supplier = await prisma.supplier.create({
      data: {
        name: 'Order Test Supplier',
        email: 'order-supplier@test.com',
        isActive: true
      }
    });
    testSupplierId = supplier.id;

    // Create test reagent
    const reagent = await prisma.reagent.create({
      data: {
        name: 'Order Test Reagent',
        catalogNumber: 'ORDER-TEST-001',
        category: 'REAGENT',
        supplierId: testSupplierId,
        currentStock: 50,
        minimumStock: 10
      }
    });
    testReagentId = reagent.id;
  });

  afterAll(async () => {
    await globalThis.testHelpers.cleanupTestData();
  });

  describe('POST /api/orders', () => {
    it('should create a new order in DRAFT status', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          supplierId: testSupplierId,
          items: [
            {
              reagentId: testReagentId,
              quantity: 10,
              unitPrice: 100.00
            }
          ],
          notes: 'Test order creation'
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.status).toBe('DRAFT');
      expect(response.body.data.supplierId).toBe(testSupplierId);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].quantity).toBe(10);
      expect(response.body.data.totalAmount).toBe(1000); // 10 * 100
      testOrderId = response.body.data.id;
    });

    it('should create order with multiple items', async () => {
      // Create another reagent
      const reagent2 = await prisma.reagent.create({
        data: {
          name: 'Second Reagent',
          catalogNumber: 'ORDER-TEST-002',
          category: 'CELLS',
          supplierId: testSupplierId
        }
      });

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          supplierId: testSupplierId,
          items: [
            { reagentId: testReagentId, quantity: 5, unitPrice: 100 },
            { reagentId: reagent2.id, quantity: 3, unitPrice: 200 }
          ]
        })
        .expect(201);

      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.totalAmount).toBe(1100); // (5*100) + (3*200)
    });

    it('should reject order without items', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          supplierId: testSupplierId,
          items: []
        })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', false);
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });

    it('should reject order with invalid supplier', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          supplierId: 'non-existent-supplier',
          items: [{ reagentId: testReagentId, quantity: 1, unitPrice: 100 }]
        })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', false);
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });

    it('should reject without authentication', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({
          supplierId: testSupplierId,
          items: [{ reagentId: testReagentId, quantity: 1, unitPrice: 100 }]
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/orders', () => {
    it('should return list of orders', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/orders?status=DRAFT')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      response.body.data.forEach((order: any) => {
        expect(order.status).toBe('DRAFT');
      });
    });

    it('should filter by supplier', async () => {
      const response = await request(app)
        .get(`/api/orders?supplierId=${testSupplierId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      response.body.data.forEach((order: any) => {
        expect(order.supplierId).toBe(testSupplierId);
      });
    });

    it('should filter by date range', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request(app)
        .get(`/api/orders?startDate=${today}&endDate=${today}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should return order by ID with items', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.id).toBe(testOrderId);
      expect(response.body.data.items).toBeDefined();
      expect(response.body.data.items.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent order', async () => {
      const response = await request(app)
        .get('/api/orders/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('PUT /api/orders/:id', () => {
    it('should update DRAFT order', async () => {
      const response = await request(app)
        .put(`/api/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notes: 'Updated notes',
          items: [
            {
              reagentId: testReagentId,
              quantity: 15, // Changed from 10
              unitPrice: 100
            }
          ]
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.notes).toBe('Updated notes');
      expect(response.body.data.totalAmount).toBe(1500); // 15 * 100
    });

    it('should reject updating non-DRAFT order', async () => {
      // Create and approve an order
      const approvedOrder = await prisma.order.create({
        data: {
          supplierId: testSupplierId,
          status: 'APPROVED',
          totalAmount: 100
        }
      });

      const response = await request(app)
        .put(`/api/orders/${approvedOrder.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notes: 'Trying to update approved order'
        })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', false);
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/orders/:id/approve', () => {
    it('should approve DRAFT order', async () => {
      const response = await request(app)
        .post(`/api/orders/${testOrderId}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          approvedBy: 'admin-user'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.status).toBe('PENDING_SAP');
      expect(response.body.data.approvedBy).toBeDefined();
      expect(response.body.data.approvedAt).toBeDefined();
    });

    it('should reject approving non-DRAFT order', async () => {
      // Try to approve again
      const response = await request(app)
        .post(`/api/orders/${testOrderId}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          approvedBy: 'admin-user'
        })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', false);
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/orders/:id/confirm-sap', () => {
    it('should confirm SAP for PENDING_SAP order', async () => {
      const response = await request(app)
        .post(`/api/orders/${testOrderId}/confirm-sap`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sapNumber: 'SAP-TEST-12345'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.status).toBe('APPROVED');
      expect(response.body.data.sapNumber).toBe('SAP-TEST-12345');
    });
  });

  describe('POST /api/orders/:id/receive', () => {
    let orderToReceive: any;
    let orderItemId: string;

    beforeEach(async () => {
      // Create a fresh approved order for receiving
      orderToReceive = await prisma.order.create({
        data: {
          supplierId: testSupplierId,
          status: 'APPROVED',
          totalAmount: 500,
          items: {
            create: [
              {
                reagentId: testReagentId,
                quantity: 5,
                unitPrice: 100
              }
            ]
          }
        },
        include: { items: true }
      });
      orderItemId = orderToReceive.items[0].id;
    });

    it('should receive order and create batches', async () => {
      const response = await request(app)
        .post(`/api/orders/${orderToReceive.id}/receive`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [
            {
              orderItemId: orderItemId,
              receivedQuantity: 5,
              lotNumber: 'LOT-RECEIVE-001',
              expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            }
          ]
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.status).toBe('FULLY_RECEIVED');
      expect(response.body.data.batches).toBeDefined();
      expect(response.body.data.batches.length).toBeGreaterThan(0);
      expect(response.body.data.batches[0].lotNumber).toBe('LOT-RECEIVE-001');
    });

    it('should handle partial receipt', async () => {
      const response = await request(app)
        .post(`/api/orders/${orderToReceive.id}/receive`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [
            {
              orderItemId: orderItemId,
              receivedQuantity: 3, // Only 3 of 5 ordered
              lotNumber: 'LOT-PARTIAL-001',
              expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            }
          ]
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.status).toBe('PARTIALLY_RECEIVED');
    });

    it('should update reagent stock after receipt', async () => {
      const initialStock = await prisma.reagent.findUnique({
        where: { id: testReagentId },
        select: { currentStock: true }
      });

      await request(app)
        .post(`/api/orders/${orderToReceive.id}/receive`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [
            {
              orderItemId: orderItemId,
              receivedQuantity: 5,
              lotNumber: 'LOT-STOCK-UPDATE',
              expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            }
          ]
        });

      const updatedStock = await prisma.reagent.findUnique({
        where: { id: testReagentId },
        select: { currentStock: true }
      });

      expect(updatedStock!.currentStock).toBe(initialStock!.currentStock + 5);
    });

    it('should reject receiving more than ordered', async () => {
      const response = await request(app)
        .post(`/api/orders/${orderToReceive.id}/receive`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [
            {
              orderItemId: orderItemId,
              receivedQuantity: 10, // Ordered only 5
              lotNumber: 'LOT-EXCESS',
              expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            }
          ]
        })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', false);
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });

    it('should require lot number and expiry date', async () => {
      const response = await request(app)
        .post(`/api/orders/${orderToReceive.id}/receive`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [
            {
              orderItemId: orderItemId,
              receivedQuantity: 5
              // Missing lotNumber and expiryDate
            }
          ]
        })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', false);
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe('DELETE /api/orders/:id', () => {
    it('should cancel DRAFT order', async () => {
      const draftOrder = await prisma.order.create({
        data: {
          supplierId: testSupplierId,
          status: 'DRAFT',
          totalAmount: 100
        }
      });

      const response = await request(app)
        .delete(`/api/orders/${draftOrder.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.status).toBe('CANCELLED');
    });

    it('should reject canceling received order', async () => {
      const receivedOrder = await prisma.order.create({
        data: {
          supplierId: testSupplierId,
          status: 'FULLY_RECEIVED',
          totalAmount: 100
        }
      });

      const response = await request(app)
        .delete(`/api/orders/${receivedOrder.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', false);
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Order Status Transitions', () => {
    it('should follow valid status flow: DRAFT → PENDING_SAP → APPROVED → FULLY_RECEIVED', async () => {
      // 1. Create DRAFT order
      const createResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          supplierId: testSupplierId,
          items: [{ reagentId: testReagentId, quantity: 1, unitPrice: 100 }]
        });
      const orderId = createResponse.body.data.id;
      expect(createResponse.body.data.status).toBe('DRAFT');

      // 2. Approve → PENDING_SAP
      const approveResponse = await request(app)
        .post(`/api/orders/${orderId}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ approvedBy: 'admin' });
      expect(approveResponse.body.data.status).toBe('PENDING_SAP');

      // 3. Confirm SAP → APPROVED
      const sapResponse = await request(app)
        .post(`/api/orders/${orderId}/confirm-sap`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ sapNumber: 'SAP-FLOW-TEST' });
      expect(sapResponse.body.data.status).toBe('APPROVED');

      // 4. Receive → FULLY_RECEIVED
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      });
      const receiveResponse = await request(app)
        .post(`/api/orders/${orderId}/receive`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{
            orderItemId: order!.items[0].id,
            receivedQuantity: 1,
            lotNumber: 'LOT-FLOW',
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          }]
        });
      expect(receiveResponse.body.data.status).toBe('FULLY_RECEIVED');
    });
  });
});
