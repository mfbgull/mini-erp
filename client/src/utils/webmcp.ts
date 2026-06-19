// Types for WebMCP tool definitions and API
interface ToolParameterProperty {
  type: string;
  description?: string;
  default?: unknown;
  optional?: boolean;
  format?: string;
  enum?: string[];
  items?: Record<string, unknown>;
  minimum?: number;
}

interface ErpToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, ToolParameterProperty>;
    required?: string[];
  };
}

interface WebMCPApi {
  registerTool: (tool: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    handler: (params: Record<string, unknown>) => Promise<unknown>;
  }) => void;
}

interface WindowWithWebMCP extends Window {
  WebMCP?: WebMCPApi;
  mockWebMCP?: {
    enable: () => void;
    registerTool: (tool: {
      name: string;
      description: string;
      parameters: Record<string, unknown>;
      handler: (params: Record<string, unknown>) => Promise<unknown>;
    }) => void;
  };
}

type ToolParams = Record<string, unknown>;

const erpTools = {
  searchCustomers: {
    name: "search_customers",
    description: "Search for customers in the ERP system by name or code",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search term - can be customer name, code, email, or phone"
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (default: 10)",
          default: 10
        }
      },
      required: ["query"]
    }
  },

  getCustomer: {
    name: "get_customer",
    description: "Get detailed information about a specific customer including their balance and transaction history",
    parameters: {
      type: "object",
      properties: {
        customer_id: {
          type: "number",
          description: "The unique customer ID"
        }
      },
      required: ["customer_id"]
    }
  },

  searchItems: {
    name: "search_items",
    description: "Search for items/products in inventory by name, SKU, or category",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search term - item name, SKU, or description"
        },
        category: {
          type: "string",
          description: "Optional category filter",
          optional: true
        },
        in_stock_only: {
          type: "boolean",
          description: "Only return items with stock available",
          default: false
        }
      },
      required: ["query"]
    }
  },

  checkStock: {
    name: "check_stock",
    description: "Check if requested quantity of items is available in stock",
    parameters: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              item_id: { type: "number" },
              quantity: { type: "number" }
            }
          }
        }
      },
      required: ["items"]
    }
  },

  createInvoice: {
    name: "create_invoice",
    description: "Create a new sales invoice for a customer with line items",
    parameters: {
      type: "object",
      properties: {
        customer_id: {
          type: "number",
          description: "Customer ID who will be billed"
        },
        invoice_date: {
          type: "string",
          format: "date",
          description: "Invoice date in YYYY-MM-DD format (default: today)"
        },
        due_date: {
          type: "string",
          format: "date",
          description: "Payment due date in YYYY-MM-DD format"
        },
        terms: {
          type: "string",
          enum: ["Due on Receipt", "Net 7", "Net 14", "Net 30", "Net 60"],
          description: "Payment terms",
          default: "Net 14"
        },
        notes: {
          type: "string",
          description: "Optional notes to include on the invoice",
          optional: true
        },
        items: {
          type: "array",
          description: "Line items for the invoice",
          items: {
            type: "object",
            properties: {
              item_id: { type: "number" },
              quantity: { type: "number", minimum: 1 },
              unit_price: { type: "number" },
              tax_rate: { type: "number", default: 0 },
              discount_percent: { type: "number", default: 0 }
            },
            required: ["item_id", "quantity", "unit_price"]
          }
        },
        record_payment: {
          type: "boolean",
          description: "Whether to record a payment with this invoice",
          default: false
        },
        payment: {
          type: "object",
          optional: true,
          properties: {
            amount: { type: "number" },
            method: { type: "string", enum: ["Cash", "Card", "Bank Transfer", "Check"] },
            reference: { type: "string" },
            date: { type: "string", format: "date" }
          }
        }
      },
      required: ["customer_id", "items"]
    }
  },

  getInvoice: {
    name: "get_invoice",
    description: "Retrieve details of a specific invoice including line items and payment status",
    parameters: {
      type: "object",
      properties: {
        invoice_id: {
          type: "number",
          description: "The invoice ID"
        }
      },
      required: ["invoice_id"]
    }
  },

  recordPayment: {
    name: "record_payment",
    description: "Record a payment for an existing invoice",
    parameters: {
      type: "object",
      properties: {
        invoice_id: {
          type: "number",
          description: "The invoice to apply payment to"
        },
        amount: {
          type: "number",
          description: "Payment amount",
          minimum: 0.01
        },
        method: {
          type: "string",
          enum: ["Cash", "Card", "Bank Transfer", "Check", "Other"],
          description: "Payment method"
        },
        reference: {
          type: "string",
          description: "Reference number (check #, transaction ID, etc.)",
          optional: true
        },
        date: {
          type: "string",
          format: "date",
          description: "Payment date (default: today)"
        },
        notes: {
          type: "string",
          description: "Optional payment notes",
          optional: true
        }
      },
      required: ["invoice_id", "amount", "method"]
    }
  },

  getSalesReport: {
    name: "get_sales_report",
    description: "Generate a sales report for a date range",
    parameters: {
      type: "object",
      properties: {
        start_date: {
          type: "string",
          format: "date",
          description: "Start date (YYYY-MM-DD)"
        },
        end_date: {
          type: "string",
          format: "date",
          description: "End date (YYYY-MM-DD)"
        },
        group_by: {
          type: "string",
          enum: ["day", "week", "month"],
          description: "How to group the report",
          default: "day"
        }
      },
      required: ["start_date", "end_date"]
    }
  }
};

class MiniERPWebMCP {
  tools: typeof erpTools;
  state: { currentUser: null; currentContext: null };

  constructor() {
    this.tools = erpTools;
    this.state = {
      currentUser: null,
      currentContext: null
    };
  }

  initialize() {
    if (typeof window === 'undefined') {
      console.log('WebMCP: Not in browser environment');
      return;
    }

    const win = window as unknown as WindowWithWebMCP;
    if (!win.WebMCP) {
      console.log('WebMCP: Browser does not support WebMCP yet');
      console.log('WebMCP: Requires Chrome Canary 146+ with --enable-features=WebMCP flag');
      return;
    }

    this.registerTools(win.WebMCP);
    console.log('WebMCP: Mini ERP tools registered successfully');
  }

  registerTools(WebMCP: WebMCPApi) {
    Object.values(this.tools).forEach(tool => {
      WebMCP.registerTool({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters as unknown as Record<string, unknown>,
        handler: this.createHandler(tool as unknown as ErpToolDefinition)
      });
    });
  }

  createHandler(toolDefinition: ErpToolDefinition) {
    return async (params: ToolParams) => {
      console.log(`WebMCP: Executing ${toolDefinition.name}`, params);
      
      try {
        switch (toolDefinition.name) {
          case 'search_customers':
            return await this.handleSearchCustomers(params);
          case 'get_customer':
            return await this.handleGetCustomer(params);
          case 'search_items':
            return await this.handleSearchItems(params);
          case 'check_stock':
            return await this.handleCheckStock(params);
          case 'create_invoice':
            return await this.handleCreateInvoice(params);
          case 'get_invoice':
            return await this.handleGetInvoice(params);
          case 'record_payment':
            return await this.handleRecordPayment(params);
          case 'get_sales_report':
            return await this.handleGetSalesReport(params);
          default:
            throw new Error(`Unknown tool: ${toolDefinition.name}`);
        }
      } catch (error) {
        console.error(`WebMCP Error in ${toolDefinition.name}:`, error);
        throw error;
      }
    };
  }

  async handleSearchCustomers(params: ToolParams) {
    const response = await fetch(
      `/api/mobile-invoices/customers/search?q=${encodeURIComponent(String(params.query))}&limit=${params.limit || 10}`
    );
    return response.json();
  }

  async handleGetCustomer(params: ToolParams) {
    const response = await fetch(`/api/customers/${params.customer_id}`);
    return response.json();
  }

  async handleSearchItems(params: ToolParams) {
    const url = `/api/mobile-invoices/items/search?q=${encodeURIComponent(String(params.query))}`;
    const response = await fetch(url);
    return response.json();
  }

  async handleCheckStock(params: ToolParams) {
    const response = await fetch('/api/inventory/check-stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: params.items })
    });
    return response.json();
  }

  async handleCreateInvoice(params: ToolParams) {
    const invoiceData = {
      customer_id: params.customer_id,
      invoice_date: params.invoice_date || new Date().toISOString().split('T')[0],
      due_date: params.due_date,
      terms: params.terms || 'Net 14',
      notes: params.notes,
      items: params.items,
      record_payment: params.record_payment,
      payment: params.payment
    };

    const response = await fetch('/api/mobile-invoices/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData)
    });
    return response.json();
  }

  async handleGetInvoice(params: ToolParams) {
    const response = await fetch(`/api/invoices/${params.invoice_id}`);
    return response.json();
  }

  async handleRecordPayment(params: ToolParams) {
    const paymentData = {
      invoice_id: params.invoice_id,
      amount: params.amount,
      payment_method: params.method,
      reference_no: params.reference,
      payment_date: params.date || new Date().toISOString().split('T')[0],
      notes: params.notes
    };

    const response = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });
    return response.json();
  }

  async handleGetSalesReport(params: ToolParams) {
    const response = await fetch(
      `/api/reports/sales?start=${params.start_date}&end=${params.end_date}&group_by=${params.group_by || 'day'}`
    );
    return response.json();
  }
}

const webmcp = new MiniERPWebMCP();

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      webmcp.initialize();
      setupMockFallback();
    });
  } else {
    webmcp.initialize();
    setupMockFallback();
  }
}

function setupMockFallback() {
  const win = window as unknown as WindowWithWebMCP;
  if (!win.WebMCP && win.mockWebMCP) {
    console.log('WebMCP: Real WebMCP not found, using mock fallback for testing');
    win.mockWebMCP.enable();
    
    Object.values(erpTools).forEach(tool => {
      win.mockWebMCP!.registerTool({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters as unknown as Record<string, unknown>,
        handler: createMockHandler(tool as unknown as ErpToolDefinition)
      });
    });
    
    win.WebMCP = win.mockWebMCP;
    console.log('WebMCP: Mock fallback initialized with', Object.keys(erpTools).length, 'tools');
    console.log('WebMCP: You can now test with window.WebMCP.callTool()');
  }
}

function createMockHandler(toolDefinition: ErpToolDefinition) {
  return async (params: ToolParams) => {
    console.log(`WebMCP Mock: Executing ${toolDefinition.name}`, params);
    
    switch (toolDefinition.name) {
      case 'search_customers':
        return mockSearchCustomers(params);
      case 'get_customer':
        return mockGetCustomer(params);
      case 'search_items':
        return mockSearchItems(params);
      case 'check_stock':
        return mockCheckStock(params);
      case 'create_invoice':
        return mockCreateInvoice(params);
      case 'get_invoice':
        return mockGetInvoice(params);
      case 'record_payment':
        return mockRecordPayment(params);
      case 'get_sales_report':
        return mockGetSalesReport(params);
      default:
        throw new Error(`Unknown tool: ${toolDefinition.name}`);
    }
  };
}

async function mockSearchCustomers(params: ToolParams) {
  try {
    const response = await fetch(
      `/api/mobile-invoices/customers/search?q=${encodeURIComponent(String(params.query))}&limit=${params.limit || 10}`
    );
    return response.json();
  } catch (_e) {
    return {
      success: true,
      data: [
        { id: 1, customer_name: "Test Customer 1", customer_code: "CUST001", email: "test1@example.com" },
        { id: 2, customer_name: "Test Customer 2", customer_code: "CUST002", email: "test2@example.com" }
      ]
    };
  }
}

async function mockGetCustomer(params: ToolParams) {
  return {
    success: true,
    data: {
      id: params.customer_id,
      customer_name: "Test Customer",
      customer_code: "CUST001",
      email: "test@example.com",
      balance: 1500.00
    }
  };
}

async function mockSearchItems(params: ToolParams) {
  try {
    const url = `/api/mobile-invoices/items/search?q=${encodeURIComponent(String(params.query))}`;
    const response = await fetch(url);
    return response.json();
  } catch (_e) {
    return {
      success: true,
      data: [
        { id: 1, name: "Test Item 1", sku: "ITEM001", unit_price: 100.00, current_stock: 50 },
        { id: 2, name: "Test Item 2", sku: "ITEM002", unit_price: 200.00, current_stock: 30 }
      ]
    };
  }
}

async function mockCheckStock(params: ToolParams) {
  return {
    success: true,
    available: true,
    items: (params.items as Array<{ quantity: number; unit_price: number }>).map((item: { quantity: number; unit_price: number }) => ({
      ...item,
      available: 100,
      sufficient: true
    }))
  };
}

async function mockCreateInvoice(params: ToolParams) {
  const total = (params.items as Array<{ quantity: number; unit_price: number }>).reduce((sum: number, item) => 
    sum + (item.quantity * item.unit_price), 0
  );
  
  return {
    success: true,
    data: {
      id: Math.floor(Math.random() * 10000),
      invoice_number: `INV-${Date.now()}`,
      customer_id: params.customer_id,
      total: total,
      status: "Created",
      message: "Invoice created successfully (MOCK)"
    }
  };
}

async function mockGetInvoice(params: ToolParams) {
  return {
    success: true,
    data: {
      id: params.invoice_id,
      invoice_number: "INV-1234",
      total: 500.00,
      paid: 0,
      balance: 500.00,
      status: "Draft"
    }
  };
}

async function mockRecordPayment(params: ToolParams) {
  return {
    success: true,
    data: {
      payment_id: Math.floor(Math.random() * 10000),
      invoice_id: params.invoice_id,
      amount: params.amount,
      new_balance: 0,
      status: "Paid"
    }
  };
}

async function mockGetSalesReport(params: ToolParams) {
  return {
    success: true,
    data: {
      total_sales: 50000.00,
      total_invoices: 150,
      average_invoice: 333.33,
      period: `${params.start_date} to ${params.end_date}`
    }
  };
}

export default webmcp;
export { erpTools };
