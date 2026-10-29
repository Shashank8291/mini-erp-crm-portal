// Intelligent client-side mock adapter fallback for offline, serverless, or static deployments

interface MockUser {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Sales' | 'Warehouse' | 'Accounts';
  mobile: string;
}

const mockUsers: Record<string, { pass: string; user: MockUser }> = {
  'admin@erp.com': { pass: 'Admin@123', user: { id: 1, name: 'Admin User', email: 'admin@erp.com', role: 'Admin', mobile: '+91 98765 00001' } },
  'sales@erp.com': { pass: 'Sales@123', user: { id: 2, name: 'Sales Representative', email: 'sales@erp.com', role: 'Sales', mobile: '+91 98765 00002' } },
  'warehouse@erp.com': { pass: 'Warehouse@123', user: { id: 3, name: 'Warehouse Officer', email: 'warehouse@erp.com', role: 'Warehouse', mobile: '+91 98765 00003' } },
  'accounts@erp.com': { pass: 'Accounts@123', user: { id: 4, name: 'Accounts Manager', email: 'accounts@erp.com', role: 'Accounts', mobile: '+91 98765 00004' } },
};

const initialCustomers = [
  {
    id: 1,
    name: 'Rajesh Sharma',
    mobile: '+91 98765 43210',
    email: 'rajesh@apexretail.com',
    business_name: 'Apex Retailers Ltd',
    gst_no: '27AAACA123411Z5',
    type: 'Wholesale',
    address: '102 Industrial Area, Sector 4, Mumbai',
    status: 'Active',
    follow_up_date: '2026-07-25',
    notes: 'Interested in bulk order of electronics for Q3 sale.',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 2,
    name: 'Priya Patel',
    mobile: '+91 91234 56789',
    email: 'priya@bluestar.in',
    business_name: 'Blue Star Electronics',
    gst_no: '24BBBCB567822Z9',
    type: 'Retail',
    address: 'Shop 14, City Mall, MG Road, Ahmedabad',
    status: 'Active',
    follow_up_date: '2026-07-28',
    notes: 'Requested product catalogue with wholesale prices.',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 3,
    name: 'Amit Verma',
    mobile: '+91 99887 76655',
    email: 'amit@vermatraders.co',
    business_name: 'Verma Traders & Distributors',
    gst_no: '07CCCC123433Z1',
    type: 'Distributor',
    address: 'Warehouse 8, Transport Nagar, Delhi',
    status: 'Lead',
    follow_up_date: '2026-07-22',
    notes: 'Initial discussion done. Follow up for first purchase order.',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

const initialProducts = [
  {
    id: 1,
    name: 'Wireless Bluetooth Headphones Pro',
    sku: 'SKU-ELEC-001',
    category: 'Electronics',
    unit_price: 2499.0,
    current_stock: 50,
    min_stock_alert: 10,
    location: 'Aisle 3, Rack B',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Smart Fitness Tracker Watch',
    sku: 'SKU-ELEC-002',
    category: 'Electronics',
    unit_price: 1899.0,
    current_stock: 8,
    min_stock_alert: 15,
    location: 'Aisle 1, Rack A',
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Ultra-Slim Power Bank 20000mAh',
    sku: 'SKU-ELEC-003',
    category: 'Accessories',
    unit_price: 1299.0,
    current_stock: 120,
    min_stock_alert: 25,
    location: 'Aisle 2, Rack C',
    created_at: new Date().toISOString(),
  },
  {
    id: 4,
    name: 'Noise-Canceling Wireless Earbuds',
    sku: 'SKU-ELEC-004',
    category: 'Electronics',
    unit_price: 3499.0,
    current_stock: 4,
    min_stock_alert: 20,
    location: 'Aisle 1, Rack C',
    created_at: new Date().toISOString(),
  },
  {
    id: 5,
    name: 'Fast Charging USB-C Cable (Pack of 3)',
    sku: 'SKU-ELEC-005',
    category: 'Cables',
    unit_price: 499.0,
    current_stock: 250,
    min_stock_alert: 50,
    location: 'Aisle 4, Rack A',
    created_at: new Date().toISOString(),
  },
];

const initialStockMovements = [
  {
    id: 1,
    product_id: 1,
    product_name: 'Wireless Bluetooth Headphones Pro',
    sku: 'SKU-ELEC-001',
    quantity_changed: 50,
    movement_type: 'IN',
    reason: 'Initial supplier shipment receipt',
    created_by_name: 'Warehouse Officer',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 2,
    product_id: 2,
    product_name: 'Smart Fitness Tracker Watch',
    sku: 'SKU-ELEC-002',
    quantity_changed: 8,
    movement_type: 'IN',
    reason: 'Restocking batch #41',
    created_by_name: 'Warehouse Officer',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

const initialOrders = [
  {
    id: 1,
    order_number: 'ORD-20261029-0001',
    customer_id: 1,
    customer_name: 'Rajesh Sharma',
    business_name: 'Apex Retailers Ltd',
    status: 'Confirmed',
    total_quantity: 12,
    total_amount: 29988,
    created_by_name: 'Sales Representative',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    items: [
      {
        id: 1,
        product_id: 1,
        product_name_snapshot: 'Wireless Bluetooth Headphones Pro',
        product_price_snapshot: 2499.0,
        quantity: 12,
      },
    ],
  },
];

class MockStore {
  customers = [...initialCustomers];
  products = [...initialProducts];
  stockMovements = [...initialStockMovements];
  orders = [...initialOrders];

  constructor() {
    try {
      const savedCust = localStorage.getItem('erp_mock_customers');
      if (savedCust) this.customers = JSON.parse(savedCust);

      const savedProd = localStorage.getItem('erp_mock_products');
      if (savedProd) this.products = JSON.parse(savedProd);

      const savedOrders = localStorage.getItem('erp_mock_orders');
      if (savedOrders) this.orders = JSON.parse(savedOrders);

      const savedMov = localStorage.getItem('erp_mock_movements');
      if (savedMov) this.stockMovements = JSON.parse(savedMov);
    } catch {
      // LocalStorage unavailable
    }
  }

  save() {
    try {
      localStorage.setItem('erp_mock_customers', JSON.stringify(this.customers));
      localStorage.setItem('erp_mock_products', JSON.stringify(this.products));
      localStorage.setItem('erp_mock_orders', JSON.stringify(this.orders));
      localStorage.setItem('erp_mock_movements', JSON.stringify(this.stockMovements));
    } catch {}
  }

  handle(config: any): { status: number; data: any } | null {
    const url = (config.url || '').replace(/^\/api/, '');
    const method = (config.method || 'get').toLowerCase();

    // 1. Auth: /auth/login
    if (url === '/auth/login' && method === 'post') {
      const { email, password } = JSON.parse(config.data || '{}');
      const found = mockUsers[email.toLowerCase()];
      if (found && found.pass === password) {
        return {
          status: 200,
          data: {
            success: true,
            data: {
              token: 'demo-jwt-token-' + Date.now(),
              user: found.user,
            },
            message: 'Login successful',
          },
        };
      }
      return {
        status: 401,
        data: { success: false, message: 'Invalid email or password' },
      };
    }

    // 2. Auth: /auth/me
    if (url === '/auth/me' && method === 'get') {
      const u = localStorage.getItem('user');
      const currentUser = u ? JSON.parse(u) : mockUsers['admin@erp.com'].user;
      return {
        status: 200,
        data: { success: true, data: currentUser },
      };
    }

    // 3. Auth: /auth/profile
    if (url === '/auth/profile' && method === 'put') {
      const body = JSON.parse(config.data || '{}');
      const u = localStorage.getItem('user');
      const currentUser = u ? JSON.parse(u) : mockUsers['admin@erp.com'].user;
      currentUser.name = body.name || currentUser.name;
      currentUser.mobile = body.mobile || currentUser.mobile;
      localStorage.setItem('user', JSON.stringify(currentUser));
      return {
        status: 200,
        data: { success: true, data: currentUser, message: 'Profile updated successfully' },
      };
    }

    // 4. Dashboard Stats: /dashboard/stats
    if (url === '/dashboard/stats' && method === 'get') {
      const lowStock = this.products.filter((p) => p.current_stock <= p.min_stock_alert).length;
      return {
        status: 200,
        data: {
          success: true,
          data: {
            customers: {
              total: this.customers.length,
              active: this.customers.filter((c) => c.status === 'Active').length,
              leads: this.customers.filter((c) => c.status === 'Lead').length,
            },
            products: {
              total: this.products.length,
              lowStock,
            },
            orders: {
              total: this.orders.length,
              drafts: this.orders.filter((o) => o.status === 'Draft').length,
              confirmed: this.orders.filter((o) => o.status === 'Confirmed').length,
            },
            recentOrders: this.orders.slice(0, 5),
          },
        },
      };
    }

    // 5. Customers
    if (url.startsWith('/customers')) {
      if (method === 'get') {
        const idMatch = url.match(/^\/customers\/(\d+)$/);
        if (idMatch) {
          const cust = this.customers.find((c) => c.id === parseInt(idMatch[1]));
          return { status: 200, data: { success: true, data: cust } };
        }
        return {
          status: 200,
          data: {
            success: true,
            data: { customers: this.customers, total: this.customers.length, page: 1, limit: 50 },
          },
        };
      }

      if (method === 'post') {
        if (url.endsWith('/notes')) {
          const idMatch = url.match(/^\/customers\/(\d+)\/notes$/);
          const body = JSON.parse(config.data || '{}');
          if (idMatch) {
            const cust = this.customers.find((c) => c.id === parseInt(idMatch[1]));
            if (cust) {
              const dateStr = new Date().toLocaleDateString();
              cust.notes = cust.notes ? `${cust.notes}\n[${dateStr}] ${body.note}` : `[${dateStr}] ${body.note}`;
              this.save();
              return { status: 200, data: { success: true, data: cust } };
            }
          }
        }
        const body = JSON.parse(config.data || '{}');
        const newCust = {
          id: Date.now(),
          ...body,
          created_at: new Date().toISOString(),
        };
        this.customers.unshift(newCust);
        this.save();
        return { status: 201, data: { success: true, data: newCust, message: 'Customer created' } };
      }

      if (method === 'put') {
        const idMatch = url.match(/^\/customers\/(\d+)$/);
        if (idMatch) {
          const body = JSON.parse(config.data || '{}');
          const idx = this.customers.findIndex((c) => c.id === parseInt(idMatch[1]));
          if (idx !== -1) {
            this.customers[idx] = { ...this.customers[idx], ...body };
            this.save();
            return { status: 200, data: { success: true, data: this.customers[idx] } };
          }
        }
      }
    }

    // 6. Products
    if (url.startsWith('/products')) {
      if (method === 'get') {
        const smMatch = url.match(/^\/products\/(\d+)\/stock-movements$/);
        if (smMatch) {
          const pid = parseInt(smMatch[1]);
          const movs = this.stockMovements.filter((m) => m.product_id === pid);
          return { status: 200, data: { success: true, data: movs } };
        }
        return {
          status: 200,
          data: {
            success: true,
            data: { products: this.products, total: this.products.length, page: 1, limit: 50 },
          },
        };
      }

      if (method === 'post') {
        const body = JSON.parse(config.data || '{}');
        const newProd = {
          id: Date.now(),
          ...body,
          current_stock: parseInt(body.current_stock || '0'),
          min_stock_alert: parseInt(body.min_stock_alert || '0'),
          unit_price: parseFloat(body.unit_price || '0'),
          created_at: new Date().toISOString(),
        };
        this.products.unshift(newProd);
        this.save();
        return { status: 201, data: { success: true, data: newProd, message: 'Product created' } };
      }

      if (method === 'put') {
        const idMatch = url.match(/^\/products\/(\d+)$/);
        if (idMatch) {
          const body = JSON.parse(config.data || '{}');
          const idx = this.products.findIndex((p) => p.id === parseInt(idMatch[1]));
          if (idx !== -1) {
            this.products[idx] = { ...this.products[idx], ...body };
            this.save();
            return { status: 200, data: { success: true, data: this.products[idx] } };
          }
        }
      }
    }

    // 7. Stock Movements
    if (url.startsWith('/stock')) {
      if (method === 'get') {
        return {
          status: 200,
          data: { success: true, data: this.stockMovements },
        };
      }

      if (method === 'post') {
        const body = JSON.parse(config.data || '{}');
        const prod = this.products.find((p) => p.id === parseInt(body.product_id));
        const qty = parseInt(body.quantity_changed);
        if (prod) {
          if (body.movement_type === 'IN') {
            prod.current_stock += qty;
          } else {
            if (prod.current_stock < qty) {
              return { status: 400, data: { success: false, message: 'Insufficient stock' } };
            }
            prod.current_stock -= qty;
          }
        }
        const mov = {
          id: Date.now(),
          product_id: parseInt(body.product_id),
          product_name: prod ? prod.name : 'Unknown Product',
          sku: prod ? prod.sku : '',
          quantity_changed: qty,
          movement_type: body.movement_type,
          reason: body.reason,
          created_by_name: 'Authenticated User',
          created_at: new Date().toISOString(),
        };
        this.stockMovements.unshift(mov);
        this.save();
        return { status: 201, data: { success: true, data: mov, message: 'Stock updated' } };
      }
    }

    // 8. Orders
    if (url.startsWith('/orders')) {
      if (method === 'get') {
        const idMatch = url.match(/^\/orders\/(\d+)$/);
        if (idMatch) {
          const order = this.orders.find((o) => o.id === parseInt(idMatch[1]));
          return { status: 200, data: { success: true, data: order } };
        }
        return {
          status: 200,
          data: { success: true, data: this.orders },
        };
      }

      if (method === 'post') {
        const body = JSON.parse(config.data || '{}');
        const cust = this.customers.find((c) => c.id === parseInt(body.customer_id));
        let totalAmt = 0;
        let totalQty = 0;

        const items = (body.items || []).map((it: any, idx: number) => {
          const prod = this.products.find((p) => p.id === parseInt(it.product_id));
          const price = prod ? prod.unit_price : 0;
          const name = prod ? prod.name : 'Item ' + (idx + 1);
          const q = parseInt(it.quantity);
          totalAmt += price * q;
          totalQty += q;

          if (body.status === 'Confirmed' && prod) {
            prod.current_stock = Math.max(0, prod.current_stock - q);
          }

          return {
            id: Date.now() + idx,
            product_id: parseInt(it.product_id),
            product_name_snapshot: name,
            product_price_snapshot: price,
            quantity: q,
          };
        });

        const newOrder = {
          id: Date.now(),
          order_number: 'ORD-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + String(Math.floor(Math.random() * 9000) + 1000),
          customer_id: parseInt(body.customer_id),
          customer_name: cust ? cust.name : 'Customer',
          business_name: cust ? cust.business_name : '',
          status: body.status || 'Draft',
          total_quantity: totalQty,
          total_amount: totalAmt,
          created_by_name: 'Current User',
          created_at: new Date().toISOString(),
          items,
        };
        this.orders.unshift(newOrder);
        this.save();
        return { status: 201, data: { success: true, data: newOrder, message: 'Order created' } };
      }

      if (method === 'put') {
        const statusMatch = url.match(/^\/orders\/(\d+)\/status$/);
        if (statusMatch) {
          const body = JSON.parse(config.data || '{}');
          const order = this.orders.find((o) => o.id === parseInt(statusMatch[1]));
          if (order) {
            order.status = body.status;
            this.save();
            return { status: 200, data: { success: true, data: order } };
          }
        }
      }
    }

    return null;
  }
}

export const mockStore = new MockStore();

