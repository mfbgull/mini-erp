---
name: pencil-invoice-wireframe
description: Build invoice/document wireframes using Pencil MCP batch_design operations. Trigger when user asks to create invoice UI mockups, wireframes, or design prototypes via Pencil.
---

# Pencil Invoice Wireframe Builder

Build professional invoice/document wireframes using Pencil MCP's `batch_design` tool. This skill encodes the proven step-by-step workflow for constructing invoice layouts via Pencil's node-based design system.

## When to Use

- User asks to create an invoice UI wireframe or mockup
- User asks to design a document layout (invoice, receipt, purchase order)
- User says "use pencil" or "pencil mcp" for design work
- Any request to prototype ERP document UIs via Pencil

## Prerequisites

- Pencil MCP server must be running and accessible
- A `.pen` file path must be provided or created (e.g., `/home/fawad/pencil-new.pen`)

## Workflow

### Step 1: Create Root Frame

Start with a top-level frame for the document page:

```
card=I(document,{type:"frame",name:"Invoice Page",width:1200,height:900,fill:"#F8FAFC"})
```

**Rules:**
- Use `document` as parent for root frames
- Set `fill:"#F8FAFC"` (slate-50) as default page background
- Standard invoice size: 1200×900

### Step 2: Header Row

Create a horizontal frame for the title area:

```
headerRow=I("<root_id>",{type:"frame",layout:"horizontal",name:"HeaderRow",width:"fill_container",height:60,padding:[0,24,0,24]})
```

Then add children inside it:

```
invTitle=I("<headerRow_id>",{type:"text",content:"Invoice",fontSize:32,fontWeight:"700",fill:"#1E293B"})
invNum=I("<headerRow_id>",{type:"text",content:"# INV-00001",fontSize:18,fontWeight:"500",fill:"#64748B",textAlign:"right"})
```

**Status badge** (right-aligned in header):
```
statusBadge=I("<headerRow_id>",{type:"frame",layout:"horizontal",width:"fit_content",height:32,padding:12,cornerRadius:16,fill:"#DCFCE7"})
statusText=I("<statusBadge_id>",{type:"text",content:"DRAFT",fontSize:12,fontWeight:"600",fill:"#166534"})
```

### Step 3: Customer Section

Horizontal frame with two cards (Bill To + Dates):

```
customerSection=I("<root_id>",{type:"frame",layout:"horizontal",name:"CustomerSection",width:"fill_container",height:100,gap:24,padding:[24,0,24,0]})
```

**Bill To card:**
```
billToCard=I("<customerSection_id>",{type:"frame",layout:"vertical",width:"fill_container",height:"fill_container",gap:8,padding:16,cornerRadius:8,fill:"#F1F5F9"})
billToLabel=I("<billToCard_id>",{type:"text",content:"BILL TO",fontSize:10,fontWeight:"600",fill:"#94A3B8"})
billToName=I("<billToCard_id>",{type:"text",content:"Acme Corporation",fontSize:14,fontWeight:"500",fill:"#1E293B"})
billToAddr=I("<billToCard_id>",{type:"text",content:"123 Business Ave, San Francisco, CA 94102",fontSize:12,fill:"#64748B"})
```

**Dates card:**
```
datesCard=I("<customerSection_id>",{type:"frame",layout:"vertical",width:"fill_container",gap:8,padding:16,cornerRadius:8,fill:"#F1F5F9"})
invDateLabel=I("<datesCard_id>",{type:"text",content:"INVOICE DATE",fontSize:10,fontWeight:"600",fill:"#94A3B8"})
invDateValue=I("<datesCard_id>",{type:"text",content:"April 14, 2026",fontSize:14,fill:"#1E293B"})
dueDateLabel=I("<datesCard_id>",{type:"text",content:"DUE DATE",fontSize:10,fontWeight:"600",fill:"#94A3B8"})
dueDateValue=I("<datesCard_id>",{type:"text",content:"April 28, 2026",fontSize:14,fill:"#1E293B"})
```

### Step 4: Line Items Table

```
lineItemsSection=I("<root_id>",{type:"frame",layout:"vertical",name:"LineItems",width:"fill_container",height:"fit_content",gap:12,padding:[24,0,24,0]})
```

**Table header row:**
```
tableHeader=I("<lineItemsSection_id>",{type:"frame",layout:"horizontal",width:"fill_container",height:40,cornerRadius:[8,8,0,0],fill:"#E2E8F0"})
descHeader=I("<tableHeader_id>",{type:"text",content:"Description",fontSize:12,fontWeight:"600",fill:"#475569"})
qtyHeader=I("<tableHeader_id>",{type:"text",content:"Qty",fontSize:12,fontWeight:"600",fill:"#475569"})
priceHeader=I("<tableHeader_id>",{type:"text",content:"Unit Price",fontSize:12,fontWeight:"600",fill:"#475569"})
amountHeader=I("<tableHeader_id>",{type:"text",content:"Amount",fontSize:12,fontWeight:"600",fill:"#475569"})
```

**Data rows** (repeat for each line item):
```
lineRow1=I("<lineItemsSection_id>",{type:"frame",layout:"horizontal",width:"fill_container",height:48,fill:"#FFFFFF",cornerRadius:4})
desc1=I("<lineRow1_id>",{type:"text",content:"Web Development Services - Phase 1",fontSize:13,fill:"#334155"})
qty1=I("<lineRow1_id>",{type:"text",content:"40",fontSize:13,fill:"#334155"})
price1=I("<lineRow1_id>",{type:"text",content:"$150.00",fontSize:13,fill:"#334155"})
amount1=I("<lineRow1_id>",{type:"text",content:"$6,000.00",fontSize:13,fontWeight:"500",fill:"#1E293B"})
```

### Step 5: Totals Section

Horizontal layout with totals on the right:

```
totalsSection=I("<root_id>",{type:"frame",layout:"horizontal",width:"fill_container",height:"fit_content",gap:24,padding:[24,0,24,0]})
totalsCard=I("<totalsSection_id>",{type:"frame",layout:"vertical",width:"fill_container",height:"fit_content",gap:12,padding:16,cornerRadius:8,fill:"#F1F5F9"})
```

**Individual total lines:**
```
subtotalLabel=I("<totalsCard_id>",{type:"text",content:"Subtotal",fontSize:13,fill:"#64748B"})
subtotalValue=I("<totalsCard_id>",{type:"text",content:"$8,500.00",fontSize:13,fill:"#1E293B"})
taxLabel=I("<totalsCard_id>",{type:"text",content:"Tax (10%)",fontSize:13,fill:"#64748B"})
taxValue=I("<totalsCard_id>",{type:"text",content:"$850.00",fontSize:13,fill:"#1E293B"})
totalLabel=I("<totalsCard_id>",{type:"text",content:"Total",fontSize:16,fontWeight:"700",fill:"#1E293B"})
totalValue=I("<totalsCard_id>",{type:"text",content:"$9,350.00",fontSize:16,fontWeight:"700",fill:"#0F172A"})
```

### Step 6: Action Buttons

```
actionsSection=I("<root_id>",{type:"frame",layout:"horizontal",width:"fill_container",height:48,gap:12,padding:[24,0,24,24]})
btnCancel=I("<actionsSection_id>",{type:"frame",layout:"horizontal",width:100,height:40,cornerRadius:8,fill:"#E2E8F0"})
cancelText=I("<btnCancel_id>",{type:"text",content:"Cancel",fontSize:14,fill:"#475569"})
btnDraft=I("<actionsSection_id>",{type:"frame",layout:"horizontal",width:100,height:40,cornerRadius:8,fill:"#E2E8F0"})
draftText=I("<btnDraft_id>",{type:"text",content:"Save Draft",fontSize:14,fill:"#475569"})
btnPrimary=I("<actionsSection_id>",{type:"frame",layout:"horizontal",width:140,height:40,cornerRadius:8,fill:"#2563EB"})
primaryText=I("<btnPrimary_id>",{type:"text",content:"Send Invoice",fontSize:14,fontWeight:"600",fill:"#FFFFFF"})
```

### Step 7: Read Tree & Take Screenshot

After building, verify the layout:

```
Pencil MCP: get_editor_state → read node tree
Pencil MCP: get_screenshot → visual verification
```

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Page background | `#F8FAFC` | Root frame fill |
| Card background | `#F1F5F9` | Info cards, totals |
| Table header | `#E2E8F0` | Column headers |
| Primary text | `#1E293B` | Headings, values |
| Secondary text | `#64748B` | Addresses, dates |
| Muted text | `#94A3B8` | Labels |
| Body text | `#334155` | Line items |
| Table text | `#475569` | Column header text |
| Primary action | `#2563EB` | Send button |
| Success badge | `#DCFCE7` bg, `#166534` text | DRAFT status |

## Node ID Pattern

Pencil returns auto-generated IDs (e.g., `trWWt`, `XnZL6`) after each insert. **Always use the returned ID** as the parent for subsequent children. Do not hardcode IDs — chain them from previous operations.

## Stopping Condition

The wireframe is complete when:
1. Root frame exists with page background
2. Header row has title, invoice number, status badge
3. Customer section has Bill To and Dates cards
4. Line items table has header + at least 2 data rows
5. Totals section shows subtotal, tax, and total
6. Action buttons row exists (Cancel, Save Draft, Send)
7. Screenshot taken for verification

## Anti-Patterns

- **Do not** create all nodes in a single batch_design call if the tree is complex — split into logical groups (header, customer, line items, totals, actions)
- **Do not** hardcode node IDs — always use the IDs returned from previous inserts
- **Do not** skip the screenshot verification step
- **Do not** use `R()` (replace) when you mean `I()` (insert) — R overwrites, I creates new
