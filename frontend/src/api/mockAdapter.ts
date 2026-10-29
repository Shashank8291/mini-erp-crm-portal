// Intelligent client-side mock adapter fallback for offline, serverless, or static deployments
import {
  demoCustomers,
  demoProducts,
  demoOrders,
  demoStockMovements,
  type DemoCustomer,
  type DemoProduct,
  type DemoOrder,
  type DemoStockMovement,
} from './demoData';

interface MockUser {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Sales' | 'Warehouse' | 'Accounts';
  mobile: string;
}

const DATASET_VERSION = 'v3.5_enterprise_b2b';

const mockUsers: Record<string, { pass: string; user: MockUser }> = {
  'admin@erp.com': { pass: 'Admin@123', user: { id: 1, name: 'Admin User', email: 'admin@erp.com', role: 'Admin', mobile: '+91 98765 00001' } },
  'sales@erp.com': { pass: 'Sales@123', user: { id: 2, name: 'Sales Representative', email: 'sales@erp.com', role: 'Sales', mobile: '+91 98765 00002' } },
  'warehouse@erp.com': { pass: 'Warehouse@123', user: { id: 3, name: 'Warehouse Officer', email: 'warehouse@erp.com', role: 'Warehouse', mobile: '+91 98765 00003' } },
  'accounts@erp.com': { pass: 'Accounts@123', user: { id: 4, name: 'Accounts Manager', email: 'accounts@erp.com', role: 'Accounts', mobile: '+91 98765 00004' } },
};

class MockStore {
  customers: DemoCustomer[] = [...demoCustomers];
  products: DemoProduct[] = [...demoProducts];
  stockMovements: DemoStockMovement[] = [...demoStockMovements];
  orders: DemoOrder[] = [...demoOrders];

  constructor() {
    try {
      const storedVersion = localStorage.getItem('erp_mock_dataset_version');
      if (storedVersion !== DATASET_VERSION) {
        // Automatically upgrade/refresh to the enterprise demo dataset
        this.save();
        localStorage.setItem('erp_mock_dataset_version', DATASET_VERSION);
        return;
      }

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
      localStorage.setItem('erp_mock_dataset_version', DATASET_VERSION);
    } catch {}
  }

  handle(config: any): { status: number; data: any } | null {
    const rawUrl = (config.url || '').replace(/^\/api/, '');
    const [pathPart] = rawUrl.split('?');
    const url = pathPart;
    const method = (config.method || 'get').toLowerCase();
    const params = config.params || {};

    // 1. Auth: /auth/login
    if (url === '/auth/login' && method === 'post') {
      const { email, password } = JSON.parse(config.data || '{}');
      const found = mockUsers[email?.toLowerCase()];
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

        // List / Search / Filter / Paginate
        let list = [...this.customers];
        const search = (params.search || '').trim().toLowerCase();
        const status = params.status;
        const type = params.type;

        if (status) {
          list = list.filter((c) => c.status === status);
        }
        if (type) {
          list = list.filter((c) => c.type === type);
        }
        if (search) {
          list = list.filter(
            (c) =>
              c.name.toLowerCase().includes(search) ||
              c.business_name.toLowerCase().includes(search) ||
              (c.email && c.email.toLowerCase().includes(search)) ||
              (c.gst_no && c.gst_no.toLowerCase().includes(search))
          );
        }

        const page = parseInt(params.page) || 1;
        const limit = parseInt(params.limit) || 10;
        const total = list.length;
        const start = (page - 1) * limit;
        const sliced = list.slice(start, start + limit);

        return {
          status: 200,
          data: {
            success: true,
            data: sliced,
            pagination: {
              total,
              page,
              limit,
              totalPages: Math.ceil(total / limit) || 1,
            },
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
              const dateStr = new Date().toLocaleDateString('en-IN');
              cust.notes = cust.notes ? `${cust.notes}\n[${dateStr}] ${body.note}` : `[${dateStr}] ${body.note}`;
              this.save();
              return { status: 200, data: { success: true, data: cust } };
            }
          }
        }
        const body = JSON.parse(config.data || '{}');
        const newCust: DemoCustomer = {
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

        const idMatch = url.match(/^\/products\/(\d+)$/);
        if (idMatch) {
          const prod = this.products.find((p) => p.id === parseInt(idMatch[1]));
          return { status: 200, data: { success: true, data: prod } };
        }

        // List / Search / Filter / Paginate
        let list = [...this.products];
        const search = (params.search || '').trim().toLowerCase();
        const lowStockOnly = params.lowStock === 'true' || params.lowStock === true;
        const category = params.category;

        if (lowStockOnly) {
          list = list.filter((p) => p.current_stock <= p.min_stock_alert);
        }
        if (category) {
          list = list.filter((p) => p.category === category);
        }
        if (search) {
          list = list.filter(
            (p) =>
              p.name.toLowerCase().includes(search) ||
              p.sku.toLowerCase().includes(search) ||
              p.category.toLowerCase().includes(search) ||
              p.location.toLowerCase().includes(search)
          );
        }

        const page = parseInt(params.page) || 1;
        const limit = parseInt(params.limit) || 10;
        const total = list.length;
        const start = (page - 1) * limit;
        const sliced = list.slice(start, start + limit);

        return {
          status: 200,
          data: {
            success: true,
            data: sliced,
            pagination: {
              total,
              page,
              limit,
              totalPages: Math.ceil(total / limit) || 1,
            },
          },
        };
      }

      if (method === 'post') {
        const body = JSON.parse(config.data || '{}');
        const newProd: DemoProduct = {
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
        let list = [...this.stockMovements];
        const page = parseInt(params.page) || 1;
        const limit = parseInt(params.limit) || 15;
        const total = list.length;
        const start = (page - 1) * limit;
        const sliced = list.slice(start, start + limit);

        return {
          status: 200,
          data: {
            success: true,
            data: sliced,
            pagination: {
              total,
              page,
              limit,
              totalPages: Math.ceil(total / limit) || 1,
            },
          },
        };
      }

      if (method === 'post') {
        const body = JSON.parse(config.data || '{}');
        const prod = this.products.find((p) => p.id === parseInt(body.product_id));
        const qty = parseInt(body.quantity || body.quantity_changed);
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
        const mov: DemoStockMovement = {
          id: Date.now(),
          product_id: parseInt(body.product_id),
          product_name: prod ? prod.name : 'Unknown Product',
          sku: prod ? prod.sku : '',
          quantity_changed: qty,
          movement_type: body.movement_type,
          reason: body.reason,
          created_by_name: 'Warehouse Officer',
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

        // List / Search / Filter / Paginate
        let list = [...this.orders];
        const search = (params.search || '').trim().toLowerCase();
        const status = params.status;

        if (status) {
          list = list.filter((o) => o.status === status);
        }
        if (search) {
          list = list.filter(
            (o) =>
              o.order_number.toLowerCase().includes(search) ||
              o.customer_name.toLowerCase().includes(search) ||
              o.business_name.toLowerCase().includes(search)
          );
        }

        const page = parseInt(params.page) || 1;
        const limit = parseInt(params.limit) || 10;
        const total = list.length;
        const start = (page - 1) * limit;
        const sliced = list.slice(start, start + limit);

        return {
          status: 200,
          data: {
            success: true,
            data: sliced,
            pagination: {
              total,
              page,
              limit,
              totalPages: Math.ceil(total / limit) || 1,
            },
          },
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
            // Append stock movement
            this.stockMovements.unshift({
              id: Date.now() + idx,
              product_id: prod.id,
              product_name: prod.name,
              sku: prod.sku,
              quantity_changed: q,
              movement_type: 'OUT',
              reason: `Order placed and confirmed`,
              created_by_name: 'Sales Representative',
              created_at: new Date().toISOString(),
            });
          }

          return {
            id: Date.now() + idx,
            order_id: 0,
            product_id: parseInt(it.product_id),
            product_name_snapshot: name,
            product_price_snapshot: price,
            quantity: q,
          };
        });

        const newOrder: DemoOrder = {
          id: Date.now(),
          order_number: 'ORD-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + String(Math.floor(Math.random() * 9000) + 1000),
          customer_id: parseInt(body.customer_id),
          customer_name: cust ? cust.name : 'Customer',
          business_name: cust ? cust.business_name : '',
          status: body.status || 'Draft',
          total_quantity: totalQty,
          total_amount: totalAmt,
          created_by_name: 'Sales Representative',
          created_at: new Date().toISOString(),
          items,
        };
        newOrder.items.forEach(it => it.order_id = newOrder.id);

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
            const oldStatus = order.status;
            const newStatus = body.status;
            order.status = newStatus;

            // If transitioning to Confirmed, deduct stock
            if (oldStatus === 'Draft' && newStatus === 'Confirmed') {
              for (const it of order.items) {
                const prod = this.products.find(p => p.id === it.product_id);
                if (prod) {
                  prod.current_stock = Math.max(0, prod.current_stock - it.quantity);
                  this.stockMovements.unshift({
                    id: Date.now() + it.id,
                    product_id: prod.id,
                    product_name: prod.name,
                    sku: prod.sku,
                    quantity_changed: it.quantity,
                    movement_type: 'OUT',
                    reason: `Order ${order.order_number} confirmed`,
                    created_by_name: 'Sales Representative',
                    created_at: new Date().toISOString(),
                  });
                }
              }
            }

            // If transitioning from Confirmed to Cancelled, restore stock
            if (oldStatus === 'Confirmed' && newStatus === 'Cancelled') {
              for (const it of order.items) {
                const prod = this.products.find(p => p.id === it.product_id);
                if (prod) {
                  prod.current_stock += it.quantity;
                  this.stockMovements.unshift({
                    id: Date.now() + it.id,
                    product_id: prod.id,
                    product_name: prod.name,
                    sku: prod.sku,
                    quantity_changed: it.quantity,
                    movement_type: 'IN',
                    reason: `Order ${order.order_number} cancelled - stock restored`,
                    created_by_name: 'Warehouse Officer',
                    created_at: new Date().toISOString(),
                  });
                }
              }
            }

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
