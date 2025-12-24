import request from 'supertest';
import app from '../app';
import { prisma } from '../utils/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Suppliers Endpoints', () => {
  let authToken: string;
  let testSupplierId: string;

  beforeAll(async () => {
    // Create test user and get token
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    const user = await prisma.user.create({
      data: {
        email: 'supplier-test@test.com',
        name: 'Supplier Test User',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });

    authToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Cleanup
    await prisma.reagent.deleteMany({ where: { supplier: { name: { contains: 'Test Supplier' } } } });
    await prisma.supplier.deleteMany({ where: { name: { contains: 'Test Supplier' } } });
    await prisma.user.deleteMany({ where: { email: 'supplier-test@test.com' } });
  });

  describe('POST /api/suppliers', () => {
    it('should create a new supplier', async () => {
      const response = await request(app)
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Supplier 1',
          email: 'supplier@test.com',
          phone: '123-456-7890',
          address: '123 Test Street'
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('Test Supplier 1');
      testSupplierId = response.body.data.id;
    });

    it('should reject duplicate supplier name', async () => {
      const response = await request(app)
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Supplier 1'
        })
        .expect('Content-Type', /json/);

      // May return 400 or 500 depending on error handling
      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject without authentication', async () => {
      const response = await request(app)
        .post('/api/suppliers')
        .send({
          name: 'Unauthorized Supplier'
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/suppliers', () => {
    it('should return list of suppliers', async () => {
      const response = await request(app)
        .get('/api/suppliers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by active status', async () => {
      const response = await request(app)
        .get('/api/suppliers?isActive=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      response.body.data.forEach((supplier: any) => {
        expect(supplier.isActive).toBe(true);
      });
    });
  });

  describe('GET /api/suppliers/:id', () => {
    it('should return supplier by ID', async () => {
      const response = await request(app)
        .get(`/api/suppliers/${testSupplierId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.id).toBe(testSupplierId);
      expect(response.body.data.name).toBe('Test Supplier 1');
    });

    it('should return 404 for non-existent supplier', async () => {
      const response = await request(app)
        .get('/api/suppliers/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('PUT /api/suppliers/:id', () => {
    it('should update supplier', async () => {
      const response = await request(app)
        .put(`/api/suppliers/${testSupplierId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Supplier 1 Updated',
          phone: '999-888-7777'
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.name).toBe('Test Supplier 1 Updated');
      expect(response.body.data.phone).toBe('999-888-7777');
    });
  });
});
