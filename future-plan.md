# Mini ERP - Feature Implementation Plan

**Project:** Mini ERP - Pakistan Business Suite
**Target Market:** Small to Medium Businesses in Pakistan
**Platform:** Desktop Electron App
**Created:** April 2026
**Version:** 1.0

---

## 1. Executive Summary

This document outlines the implementation plan for adding five key features to Mini ERP:

1. **FBR E-Invoicing** - Mandatory tax compliance for Pakistan
2. **Urdu Language Support** - Local market localization
3. **Expiry Tracking** - Industry-specific inventory management
4. **WhatsApp Integration** - Customer communication
5. **Promotion Tools** - Business growth features

**Total Estimated Timeline:** 10-12 weeks

---

## 2. FBR E-Invoicing

### Priority: HIGH | Timeline: 3-4 weeks | Complexity: High

### Description

FBR (Federal Board of Revenue) mandates all registered businesses to issue digital invoices with real-time submission to FBR portals. This feature ensures Mini ERP compliance with Pakistani tax regulations.

### Requirements

- [ ] FBR POS Registration integration
- [ ] JSON invoice generation per FBR specifications
- [ ] Real-time API submission to FBR portal
- [ ] ACK (Acknowledgment) number tracking
- [ ] Multi-provincial support (SRB, PRA, KPRA)

### Technical Implementation

#### Database Changes

```sql
-- FBR Invoice Submissions Table
CREATE TABLE fbr_invoice_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL,
  submission_date TEXT NOT NULL,
  serial_number TEXT NOT NULL,
  ack_number TEXT,
  irn_number TEXT,
  json_payload TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  response_data TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

-- Add FBR fields to invoices table
ALTER TABLE invoices ADD COLUMN fbr_submitted INTEGER DEFAULT 0;
ALTER TABLE invoices ADD COLUMN fbr_ack_number TEXT;
ALTER TABLE invoices ADD COLUMN fbr_serial_number TEXT;
```

#### Backend New Files

| File | Purpose |
|------|---------|
| `src/services/FBRService.ts` | FBR API communication |
| `src/controllers/fbrController.ts` | Request handling |
| `src/routes/fbr.ts` | API routes |
| `src/migrations/004_fbr_invoicing.sql` | Database schema |

#### Required Fields for FBR JSON

```typescript
interface FBREInvoice {
  version: "1.1";
  invoiceType: "POS" | "Credit" | "Debit";
  serialNumber: string;
  issueDate: string;
  issueTime: string;
  sellerNTN: string;
  sellerCNIC: string;
  sellerName: string;
  sellerAddress: string;
  buyerNTN?: string;
  buyerCNIC?: string;
  buyerName?: string;
  buyerAddress?: string;
  totalBillAmount: number;
  totalDiscount Given: number;
  totalTaxCharged: number;
  totalAdditionalTax: number;
  invoiceItems: {
    productCode: string;
    productName: string;
    batchNumber?: string;
    expiryDate?: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    taxRate: number;
    taxAmount: number;
  }[];
}
```

#### API Endpoints

| Endpoint | Method | Description |
|----------|--------|------------|
| `/api/fbr/submit` | POST | Submit invoice to FBR |
| `/api/fbr/status/:id` | GET | Check submission status |
| `/api/fbr/ack/:invoiceId` | GET | Get ACK by invoice |
| `/api/fbr/registration` | GET | Get FBR registration status |
| `/api/fbr/settings` | PUT | Update FBR settings |

#### Revenue Impact

- Bundle with Business tier (PKR 4,999/month)
- FBR-only option: +PKR 1,500/month

---

## 3. Urdu Language Support

### Priority: HIGH | Timeline: 2-3 weeks | Complexity: Medium

### Description

Full Urdu language interface for better local market adoption in Pakistan, especially in Khyber Pakhtunkhwa and rural areas.

### Requirements

- [ ] Urdu UI labels translation
- [ ] RTL (Right-to-Left) layout support
- [ ] Language toggle in settings
- [ ] Persist language preference
- [ ] Date/Number formatting for Pakistan

### Implementation

#### File Structure

```
client/src/
├── locales/
│   ├── en.json      (English labels)
│   └── ur.json      (Urdu labels)
├── hooks/
│   └── useTranslation.ts
└── components/
    └── LanguageToggle.tsx
```

#### Urdu Labels Sample

```json
{
  "nav": {
    "dashboard": "ڈیش باورڈ",
    "inventory": "انوینٹری",
    "sales": "فروخت",
    "purchases": "خریداری",
    "customers": "گاہک",
    "suppliers": "سپلائر",
    "invoices": "بل",
    "reports": "رپورٹس",
    "settings": "سیٹینگز",
    "expenses": "خرچے",
    "production": "پروڈکشن",
    "bom": "بل آف میٹریل",
    "pos": "پی او ایس"
  },
  "actions": {
    "save": "سیو کریں",
    "cancel": "رڈ کریں",
    "delete": "حذف کریں",
    "edit": "ترمیم کریں",
    "add": "شامل کریں",
    "search": "تلاش کریں",
    "filter": "فلٹر",
    "export": "ایکسپورٹ",
    "import": "امپورٹ"
  },
  "messages": {
    "saved": "کامیابی سے سیو ہوگیا",
    "deleted": "کامیابی سے حذف ہوگیا",
    "error": "خرطی ہوگیا",
    "confirm": "تصدیق کریں"
  },
  "fields": {
    "name": "نام",
    "quantity": "مقدار",
    "price": "قیمت",
    "total": "کل",
    "date": "تاریخ",
    "status": "حالت"
  }
}
```

#### Database Changes

```sql
ALTER TABLE settings ADD COLUMN language TEXT DEFAULT 'en';
```

---

## 4. Expiry Tracking

### Priority: HIGH | Timeline: 2-3 weeks | Complexity: Medium

### Description

Batch-level expiry tracking for pharmaceutical, food, and cosmetics industries. Prevents stock loss from expired products.

### Requirements

- [ ] Batch number management
- [ ] Expiry date tracking per batch
- [ ] Alerts before expiry (30/60/90 days)
- [ ] FEFO (First-Expired-First-Out) logic
- [ ] Expiry reports

### Implementation

#### Database Changes

```sql
-- Enable expiry tracking on items
ALTER TABLE items ADD COLUMN has_expiry INTEGER DEFAULT 0;
ALTER TABLE items ADD COLUMN default_expiry_days INTEGER;

-- Batch tracking
CREATE TABLE item_batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,
  batch_number TEXT,
  warehouse_id INTEGER,
  quantity INTEGER DEFAULT 0,
  quantity_reserved INTEGER DEFAULT 0,
  manufacture_date TEXT,
  expiry_date TEXT,
  unit_cost REAL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);

-- Expiry alerts config
CREATE TABLE expiry_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,
  days_before_expiry INTEGER DEFAULT 30,
  alert_enabled INTEGER DEFAULT 1,
  notify_email TEXT,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);
```

#### Backend Services

| Service | Purpose |
|---------|---------|
| `BatchService` | CRUD for batch operations |
| `ExpiryService` | Alert generation, FEFO logic |

#### Frontend Pages

| Page | Purpose |
|------|---------|
| `BatchesPage.tsx` | Manage item batches |
| `ExpiryAlertsPage.tsx` | Configure alerts |
| `ExpiryReport.tsx` | Expiring stock report |

#### Alert System

- Dashboard notification widget for expiring items
- Color coding: 🔴 Expired, 🟡 Expiring soon (30 days), 🟢 OK
- Configurable notification channels

---

## 5. WhatsApp Integration

### Priority: MEDIUM | Timeline: 2-3 weeks | Complexity: Low-Medium

### Description

Send invoices, reports, and promotional messages via WhatsApp for better customer communication.

### Requirements

- [ ] Generate shareable invoices (PDF/image)
- [ ] Click-to-Chat WhatsApp links
- [ ] Message templates
- [ ] Bulk message support

### Implementation

#### Three Approaches

| Approach | Cost | Effort | Reliability |
|----------|------|--------|------------|
| Click-to-Chat Links | Free | Low | High |
| PDF Export + Manual Share | Free | Low | High |
| WhatsApp Business API | ~PKR 15,000/month | High | Medium |

#### Recommended: Start with #1 and #2

```typescript
// Generate WhatsApp Click-to-Chat Link
function generateWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/92${cleanPhone.slice(1)}?text=${encodedMessage}`;
}

// Invoice PDF with WhatsApp share
interface InvoicePDFOptions {
  businessName: string;
  businessPhone: string;
  includeWhatsAppButton: boolean;
}
```

#### Backend Services

| Service | Purpose |
|---------|---------|
| `WhatsAppService` | Link generation, template management |
| `PDFService` | Enhanced invoice PDF generation |

#### Frontend Components

| Component | Purpose |
|-----------|--------|
| `WhatsAppButton.tsx` | Send via WhatsApp button |
| `InvoicePDFButton.tsx` | Download PDF button |
| `MessageTemplates.tsx` | Manage message templates |

---

## 6. Promotion & Business Growth Tools

### Priority: MEDIUM | Timeline: 3-4 weeks | Complexity: Medium

### Description

Marketing and promotion tools to help businesses grow and retain customers.

### Requirements

- [ ] Discount management system
- [ ] Customer loyalty points
- [ ] SMS campaigns
- [ ] Digital catalog generation
- [ ] QR code coupons

### Implementation

#### Database Schema

```sql
-- Discounts
CREATE TABLE discounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK(type IN ('percentage', 'fixed')) NOT NULL,
  value REAL NOT NULL,
  min_order_amount REAL DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  start_date TEXT,
  end_date TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Coupons
CREATE TABLE coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  discount_id INTEGER,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TEXT,
  valid_until TEXT,
  FOREIGN KEY (discount_id) REFERENCES discounts(id)
);

-- Loyalty Programs
CREATE TABLE loyalty_programs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  points_per_currency REAL DEFAULT 1,
  redemption_rate REAL DEFAULT 1,
  min_points_redeem INTEGER DEFAULT 100,
  active INTEGER DEFAULT 1
);

-- Customer Loyalty Points
CREATE TABLE customer_loyalty (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  program_id INTEGER NOT NULL,
  points_balance REAL DEFAULT 0,
  total_earned REAL DEFAULT 0,
  total_redeemed REAL DEFAULT 0,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (program_id) REFERENCES loyalty_programs(id)
);

-- Loyalty Transactions
CREATE TABLE loyalty_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  program_id INTEGER NOT NULL,
  points REAL NOT NULL,
  type TEXT CHECK(type IN ('earn', 'redeem')) NOT NULL,
  reference_type TEXT,
  reference_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (program_id) REFERENCES loyalty_programs(id)
);

-- SMS Campaigns
CREATE TABLE sms_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  target_segment TEXT,
  scheduled_at TEXT,
  sent_count INTEGER DEFAULT 0,
  delivery_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

#### Feature Matrix

| Feature | Database Tables | API Routes | Frontend Page |
|---------|---------------|-----------|------------|
| Discounts | `discounts` | `/api/discounts` | `PromotionsPage.tsx` |
| Coupons | `coupons` | `/api/coupons` | `CouponsPage.tsx` |
| Loyalty | `loyalty_*` | `/api/loyalty` | `LoyaltyPage.tsx` |
| SMS | `sms_campaigns` | `/api/campaigns` | `CampaignsPage.tsx` |
| Catalog | - | `/api/catalog` | - |

---

## 7. Implementation Timeline

### Phase 1: Foundation (Weeks 1-4)

| Week | Focus | Deliverables |
|------|-------|------------|
| 1 | FBR Database | Schema, migrations, basic API |
| 2 | FBR API | JSON builder, FBR submission |
| 3 | FBR UI | Submit button, status display |
| 4 | FBR Testing | Edge cases, error handling |

### Phase 2: Localization (Weeks 5-7)

| Week | Focus | Deliverables |
|------|-------|------------|
| 5 | Urdu i18n | Locale files, toggle component |
| 6 | Urdu UI | Full translation, RTL styles |
| 7 | Expiry DB | Batch tables, item flags |

### Phase 3: Growth Tools (Weeks 8-10)

| Week | Focus | Deliverables |
|------|-------|------------|
| 8 | Expiry UI | Batch modal, reports |
| 9 | WhatsApp | PDF, Click-to-Chat |
| 10 | Promotions | Discounts, basic loyalty |

### Phase 4: Advanced (Weeks 11-12)

| Week | Focus | Deliverables |
|------|-------|------------|
| 11 | Loyalty | Points engine, redemption |
| 12 | SMS | Campaign management |

---

## 8. File Structure Changes

### Backend

```
server/src/
├── controllers/
│   ├── fbrController.ts      (NEW)
│   ├── batchController.ts   (NEW)
│   ├── discountController.ts (NEW)
│   ├── loyaltyController.ts (NEW)
│   └── campaignController.ts (NEW)
├── services/
│   ├── FBRService.ts        (NEW)
│   ├── BatchService.ts     (NEW)
│   ├── ExpiryService.ts    (NEW)
│   ├── LoyaltyService.ts   (NEW)
│   ├── SMSService.ts      (NEW)
│   ├── WhatsAppService.ts (NEW)
│   └── PDFService.ts     (NEW - enhance)
├── models/
│   ├── batchModel.ts       (NEW)
│   ├── loyaltyModel.ts    (NEW)
│   └── promotionModel.ts  (NEW)
├── routes/
│   ├── fbr.ts          (NEW)
│   ├── batches.ts       (NEW)
│   ├── promotions.ts    (NEW)
│   └── loyalty.ts      (NEW)
├── migrations/
│   └── 004_fbr_expiry_promotions.sql (NEW)
└── utils/
    └── fbrJsonBuilder.ts (NEW)
```

### Frontend

```
client/src/
├── locales/
│   ├── en.json          (NEW)
│   └── ur.json          (NEW)
├── hooks/
│   └── useTranslation.ts (NEW)
├── components/
│   ├── LanguageToggle.tsx  (NEW)
│   ├── FBRError.tsx       (NEW)
│   ├── ExpiryAlert.tsx     (NEW)
│   ├── WhatsAppButton.tsx (NEW)
│   ├── PDFButton.tsx    (NEW)
│   └── DiscountBadge.tsx (NEW)
├── pages/
│   ├── FBRInvoicesPage.tsx   (NEW)
│   ├── BatchesPage.tsx    (NEW)
│   ├── ExpiryReport.tsx   (NEW)
│   ├── PromotionsPage.tsx (NEW)
│   ├── CouponsPage.tsx   (NEW)
│   ├── LoyaltyPage.tsx   (NEW)
│   ├── CampaignsPage.tsx  (NEW)
│   └── CatalogPage.tsx   (NEW)
└── styles/
    ├── rtl.css          (NEW)
    └── urdu-font.css   (NEW)
```

---

## 9. Pricing Strategy

| Tier | Price (PKR/month) | Features |
|------|-----------------|----------|
| Basic | 2,000 | Core ERP features |
| Business | 4,999 | Basic + FBR E-Invoicing + Expiry |
| Pro | 7,999 | Business + Urdu + Promotions + WhatsApp |
| Enterprise | Custom | Full + Multi-branch + Priority Support |

---

## 10. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| FBR API changes | High | Medium | Version control, modular design |
| Urdu translation accuracy | Medium | Medium | Native speaker review process |
| WhatsApp API restrictions | Medium | Low | Fallback to Click-to-Chat |
| Performance degradation | Low | High | Proper indexing, query optimization |
| Data migration issues | Medium | High | Backup strategy, staged rollout |

---

## 11. Dependencies

### Must Have Before Starting

- [ ] FBR Developer Account / POS Registration guides
- [ ] Native Urdu speaker for translation review
- [ ] SMS API provider (Fast2SMS or similar)
- [ ] WhatsApp Business API credentials (optional)

### Technical Dependencies

- [ ] `jspdf` - PDF generation
- [ ] `qrcode` - QR code generation
- [ ] `node-sms` - SMS integration

---

## 12. Backward Compatibility

All new features must maintain backward compatibility:

- [ ] Existing database schema unchanged (additive only)
- [ ] API endpoints non-breaking
- [ ] Legacy invoice format supported alongside FBR format
- [ ] Language defaults to English

---

## 13. Success Metrics

| Feature | KPI |
|--------|-----|
| FBR E-Invoicing | 100% submission success rate |
| Urdu Support | 50%+ user adoption in KP region |
| Expiry Tracking | 90%+ reduction in expired stock losses |
| WhatsApp | 30%+ invoice delivery rate |
| Promotions | 20%+ repeat customer increase |

---

## 14. Future Considerations

- Mobile app (React Native)
- Cloud sync / Multi-branch
- AI-powered sales forecasting
- E-commerce integration
- Payment gateway integration
- Bank reconciliation

---

## 15. Appendix

### Glossary

| Term | Definition |
|------|------------|
| FBR | Federal Board of Revenue (Pakistan) |
| NTN | National Tax Number |
| CNIC | Computerized National Identity Card |
| ACK | Acknowledgment Number |
| POS | Point of Sale |
| FEFO | First-Expired-First-Out |
| RTL | Right-to-Left |
| ERP | Enterprise Resource Planning |

### Reference Links

- FBR Portal: https://fbr.gov.pk
- FBR E-Invoice Documentation: (link to be added)
- WhatsApp Business API: https://developers.facebook.com/docs/whatsapp

---

**Document Version:** 1.0
**Last Updated:** April 2026
**Next Review:** Before Phase 2 implementation