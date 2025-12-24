import { prisma } from '../utils/prisma';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.LOG_LEVEL = 'silent';

// Extend Jest matchers if needed
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false
      };
    }
  }
});

// Increase timeout for database operations
jest.setTimeout(30000);

// Clean up after all tests
afterAll(async () => {
  await prisma.$disconnect();
});

// Global test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
    }
  }

  var testHelpers: {
    generateToken: (userId: string, role: string) => string;
    createTestUser: () => Promise<any>;
    cleanupTestData: () => Promise<void>;
  };
}

// Test helper functions
import jwt from 'jsonwebtoken';

globalThis.testHelpers = {
  generateToken: (userId: string, role: string = 'USER'): string => {
    return jwt.sign(
      { userId, email: `test-${userId}@test.com`, role },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
  },

  createTestUser: async () => {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('testpassword123', 10);

    return prisma.user.create({
      data: {
        email: `test-${Date.now()}@test.com`,
        name: 'Test User',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
  },

  cleanupTestData: async () => {
    // Clean up in reverse order of dependencies
    await prisma.activityLog.deleteMany({});
    await prisma.activeAlert.deleteMany({});
    await prisma.alertRule.deleteMany({});
    await prisma.inventoryTransaction.deleteMany({});
    await prisma.shipmentItem.deleteMany({});
    await prisma.shipment.deleteMany({});
    await prisma.deliveryItem.deleteMany({});
    await prisma.reagentBatch.deleteMany({});
    await prisma.delivery.deleteMany({});
    await prisma.withdrawalItem.deleteMany({});
    await prisma.withdrawalRequest.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.frameworkOrderItem.deleteMany({});
    await prisma.frameworkOrder.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.reagent.deleteMany({});
    await prisma.supplierContact.deleteMany({});
    await prisma.supplier.deleteMany({});
    await prisma.user.deleteMany({});
  }
};
