import request from 'supertest';
import app from '../app';

describe('Health Endpoint', () => {
  it('GET /health returns status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptime');
  });
});

describe('Auth Endpoints', () => {
  let token: string;

  it('POST /api/auth/login - rejects missing credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/login - rejects invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/login - accepts valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toHaveProperty('username', 'admin');

    // Extract token from cookie
    const cookies = res.headers['set-cookie'];
    if (cookies) {
      const tokenCookie = (Array.isArray(cookies) ? cookies : [cookies])
        .find((c: string) => c.startsWith('token='));
      if (tokenCookie) {
        token = tokenCookie.split(';')[0].split('=')[1];
      }
    }
  });

  it('GET /api/auth/me - rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me - returns current user with token', async () => {
    if (!token) return; // skip if login didn't work
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `token=${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('username', 'admin');
  });
});

describe('Customers Endpoints', () => {
  it('GET /api/customers - returns paginated customers list', async () => {
    const res = await request(app).get('/api/customers');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/customers - supports search parameter', async () => {
    const res = await request(app).get('/api/customers?search=test');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/customers - supports sorting', async () => {
    const res = await request(app).get('/api/customers?sortBy=customer_name&sortOrder=DESC');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/customers - rejects invalid sort column (SQL injection)', async () => {
    const res = await request(app).get('/api/customers?sortBy=id;DROP%20TABLE%20customers;--');
    // Should either use default sort or return validation error
    expect([200, 400]).toContain(res.status);
    if (res.status === 200) {
      // Data should still be returned (with safe default sort)
      expect(res.body.success).toBe(true);
    }
  });

  it('GET /api/customers/:id - returns 404 for non-existent customer', async () => {
    const res = await request(app).get('/api/customers/99999');
    expect(res.status).toBe(404);
  });
});

describe('Payments Endpoints', () => {
  it('GET /api/payments - returns paginated payments list', async () => {
    const res = await request(app).get('/api/payments');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
  });

  it('GET /api/payments - supports date range filtering', async () => {
    const res = await request(app).get('/api/payments?fromDate=2025-01-01&toDate=2026-12-31');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/payments/:id - returns 404 for non-existent payment', async () => {
    const res = await request(app).get('/api/payments/99999');
    expect(res.status).toBe(404);
  });
});

describe('Reports Endpoints', () => {
  it('GET /api/reports/ar-aging - returns AR aging report', async () => {
    const res = await request(app).get('/api/reports/ar-aging');
    expect(res.status).toBe(200);
  });

  it('GET /api/reports/dso - returns DSO metric', async () => {
    const res = await request(app).get('/api/reports/dso');
    expect(res.status).toBe(200);
  });

  it('GET /api/reports/dso - rejects invalid period', async () => {
    const res = await request(app).get('/api/reports/dso?period=abc');
    expect(res.status).toBe(400);
  });

  it('GET /api/reports/sales-summary - returns sales summary', async () => {
    const res = await request(app).get('/api/reports/sales-summary');
    expect(res.status).toBe(200);
  });

  it('GET /api/reports/stock-level - returns stock level report', async () => {
    const res = await request(app).get('/api/reports/stock-level');
    expect(res.status).toBe(200);
  });

  it('GET /api/reports/low-stock - returns low stock report', async () => {
    const res = await request(app).get('/api/reports/low-stock');
    expect(res.status).toBe(200);
  });
});

describe('Inventory Endpoints', () => {
  let token: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    const cookies = res.headers['set-cookie'];
    if (cookies) {
      const tokenCookie = (Array.isArray(cookies) ? cookies : [cookies])
        .find((c: string) => c.startsWith('token='));
      if (tokenCookie) {
        token = tokenCookie.split(';')[0].split('=')[1];
      }
    }
  });

  it('GET /api/inventory/items - rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/inventory/items');
    expect(res.status).toBe(401);
  });

  it('GET /api/inventory/items - returns inventory items with auth', async () => {
    const res = await request(app)
      .get('/api/inventory/items')
      .set('Cookie', `token=${token}`);
    expect(res.status).toBe(200);
  });

  it('GET /api/inventory/items-categories - returns categories with auth', async () => {
    const res = await request(app)
      .get('/api/inventory/items-categories')
      .set('Cookie', `token=${token}`);
    expect(res.status).toBe(200);
  });

  it('GET /api/inventory/warehouses - returns warehouses with auth', async () => {
    const res = await request(app)
      .get('/api/inventory/warehouses')
      .set('Cookie', `token=${token}`);
    expect(res.status).toBe(200);
  });
});

describe('Security Tests', () => {
  it('SQL injection via sortBy parameter is blocked', async () => {
    const res = await request(app).get('/api/customers?sortBy=id;DROP TABLE customers;--');
    // Should not crash and should return valid response
    expect([200, 400]).toContain(res.status);

    // Verify table still exists
    const check = await request(app).get('/api/customers');
    expect(check.status).toBe(200);
    expect(check.body.success).toBe(true);
  });

  it('SQL injection via sortOrder parameter is blocked', async () => {
    const res = await request(app).get('/api/payments?sortOrder=DESC;DELETE FROM payments;--');
    expect([200, 400]).toContain(res.status);

    const check = await request(app).get('/api/payments');
    expect(check.status).toBe(200);
  });

  it('SQL injection via period parameter is blocked', async () => {
    const res = await request(app).get("/api/reports/dso?period=30';DELETE FROM invoices;--");
    expect(res.status).toBe(400);
  });
});
