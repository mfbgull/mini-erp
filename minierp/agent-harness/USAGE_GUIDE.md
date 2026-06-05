# Mini ERP CLI - Complete Usage Guide

## Table of Contents

1. [Quick Start](#quick-start)
2. [Development Workflow](#development-workflow)
3. [Production Operations](#production-operations)
4. [Automation & Scripting](#automation--scripting)
5. [AI Agent Integration](#ai-agent-integration)
6. [Common Workflows](#common-workflows)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Installation

```bash
# Navigate to agent-harness directory
cd minierp/agent-harness

# Install as editable package
pip install -e .

# Verify installation
cli-anything-minierp --help
```

### First-Time Setup

```bash
# Login with default credentials (dev only — change in production)
cli-anything-minierp auth login -u admin -p admin123

# Verify session
cli-anything-minierp auth status

# Check system health
cli-anything-minierp utils health-check
```

---

## Development Workflow

### Daily Development Tasks

#### 1. Start Your Day

```bash
# Check system status
cli-anything-minierp utils system-info

# View dashboard summary
cli-anything-minierp dashboard summary

# Check overnight activity
cli-anything-minierp activity recent --limit 50
```

#### 2. Create Test Data

```bash
# Create test item
cli-anything-minierp inventory items create \
  --code "TEST-001" \
  --name "Test Product" \
  --category "Testing" \
  --stock 100 \
  --sell-price 99.99 \
  --buy-price 50.00

# Create test customer
cli-anything-minierp customers create \
  --code "TEST-CUST" \
  --name "Test Customer" \
  --email "test@example.com"

# Create test invoice
cli-anything-minierp invoices create \
  --customer-id 1 \
  --date 2024-01-15 \
  --due 2024-02-15 \
  --items '[{"item_id":1,"quantity":5,"unit_price":99.99}]'
```

#### 3. Test Reports

```bash
# Sales report
cli-anything-minierp reports sales --start 2024-01-01 --end 2024-01-31

# Profit & Loss
cli-anything-minierp reports profit-loss --start 2024-01-01 --end 2024-01-31

# Stock valuation
cli-anything-minierp inventory valuation
```

#### 4. Debug Issues

```bash
# Check audit log
cli-anything-minierp utils audit-log --entity-type "invoice" --limit 20

# View item movements
cli-anything-minierp inventory items movements 1 --start 2024-01-01 --end 2024-01-31

# Check customer ledger
cli-anything-minierp customers ledger 1
```

### Database Management (Development)

```bash
# Create backup before testing
cli-anything-minierp utils backup --name "before-feature-test"

# List backups
cli-anything-minierp utils backups

# Restore if needed
cli-anything-minierp utils restore 1

# Optimize database
cli-anything-minierp utils optimize-db

# View database stats
cli-anything-minierp utils db-stats
```

### Export Data for Analysis

```bash
# Export all items to CSV
cli-anything-minierp utils export items --format csv

# Export customers to JSON
cli-anything-minierp utils export customers --format json

# Export sales for date range
cli-anything-minierp utils export sales --format csv --start 2024-01-01 --end 2024-01-31
```

---

## Production Operations

### Daily Operations Checklist

#### Morning Checks

```bash
# 1. System health check
cli-anything-minierp utils health-check

# 2. Dashboard overview
cli-anything-minierp dashboard summary

# 3. Check low stock items
cli-anything-minierp inventory low-stock

# 4. Review customer outstanding
cli-anything-minierp reports customer-outstanding

# 5. Check pending purchase orders
cli-anything-minierp purchase-orders pending
```

#### Inventory Management

```bash
# View stock levels
cli-anything-minierp reports stock-level

# Check slow-moving items (90 days)
cli-anything-minierp inventory slow-moving --threshold 90

# Transfer stock between warehouses
cli-anything-minierp inventory transfer \
  --item-id 1 \
  --from-wh 1 \
  --to-wh 2 \
  --qty 50 \
  --ref "TRF-001" \
  --notes "Stock rebalancing"

# Adjust stock (damaged items)
cli-anything-minierp inventory adjust \
  --item-id 1 \
  --warehouse-id 1 \
  --qty -5 \
  --reason "Damaged goods" \
  --ref "ADJ-001"
```

#### Sales Operations

```bash
# Create sales order
cli-anything-minierp sales orders create \
  --customer-id 1 \
  --date 2024-01-15 \
  --items '[{"item_id":1,"quantity":10,"unit_price":100.00}]' \
  --delivery 2024-01-20

# Record payment
cli-anything-minierp payments create \
  --customer-id 1 \
  --amount 1000.00 \
  --date 2024-01-15 \
  --method "bank" \
  --reference "TXN123456"

# Process sales return
cli-anything-minierp sales create-return \
  --sale-id 1 \
  --items '[{"item_id":1,"quantity":2}]' \
  --reason "Defective items"
```

#### Financial Operations

```bash
# Record expense
cli-anything-minierp expenses create \
  --date 2024-01-15 \
  --category "Utilities" \
  --amount 500.00 \
  --description "Monthly electricity bill" \
  --method "bank"

# View trial balance
cli-anything-minierp reports trial-balance --as-of 2024-01-31

# Generate balance sheet
cli-anything-minierp reports balance-sheet --as-of 2024-01-31

# View tax summary
cli-anything-minierp reports tax-summary --start 2024-01-01 --end 2024-01-31
```

### End-of-Day Operations

```bash
# Daily sales report
cli-anything-minierp reports daily-sales --start 2024-01-15 --end 2024-01-15

# Cash flow report
cli-anything-minierp reports cash-flow --start 2024-01-01 --end 2024-01-31

# Create daily backup
cli-anything-minierp utils backup --name "daily-backup-2024-01-15"

# Clear cache
cli-anything-minierp utils clear-cache
```

### Monthly Operations

```bash
# Monthly sales summary
cli-anything-minierp reports monthly-sales 2024

# Income statement
cli-anything-minierp reports income-statement --start 2024-01-01 --end 2024-01-31

# Production efficiency
cli-anything-minierp reports production-efficiency --start 2024-01-01 --end 2024-01-31

# Export monthly data
cli-anything-minierp utils export invoices --format csv --start 2024-01-01 --end 2024-01-31
```

---

## Automation & Scripting

### Bash Scripts

#### Daily Report Script (`daily-report.sh`)

```bash
#!/bin/bash

# Daily ERP Report Generator
DATE=$(date +%Y-%m-%d)
REPORT_DIR="./reports/$DATE"

mkdir -p "$REPORT_DIR"

echo "Generating daily reports for $DATE..."

# Sales report
cli-anything-minierp --json reports sales \
  --start "$DATE" --end "$DATE" \
  > "$REPORT_DIR/sales.json"

# Inventory status
cli-anything-minierp --json inventory stock \
  > "$REPORT_DIR/inventory.json"

# Low stock alerts
cli-anything-minierp --json inventory low-stock \
  > "$REPORT_DIR/low-stock.json"

# Customer outstanding
cli-anything-minierp --json reports customer-outstanding \
  > "$REPORT_DIR/ar.json"

echo "Reports saved to $REPORT_DIR"
```

#### Backup Script (`backup.sh`)

```bash
#!/bin/bash

# Automated Backup Script
BACKUP_NAME="auto-backup-$(date +%Y%m%d-%H%M%S)"

echo "Creating backup: $BACKUP_NAME"

cli-anything-minierp utils backup --name "$BACKUP_NAME"

if [ $? -eq 0 ]; then
  echo "Backup successful!"
  
  # List old backups
  cli-anything-minierp utils backups
  
  # Optionally delete backups older than 30 days
  # (implement based on backup ID logic)
else
  echo "Backup failed!"
  exit 1
fi
```

#### Data Import Script (`import-data.sh`)

```bash
#!/bin/bash

# Import items from CSV
cli-anything-minierp utils import items \
  --file "./data/items.csv" \
  --format csv

# Import customers
cli-anything-minierp utils import customers \
  --file "./data/customers.csv" \
  --format csv

echo "Import complete!"
```

### Python Automation

#### Automated Inventory Reorder (`auto_reorder.py`)

```python
#!/usr/bin/env python3
"""Automated inventory reorder script."""

import subprocess
import json

def check_low_stock():
    """Check for low stock items."""
    result = subprocess.run(
        ['cli-anything-minierp', '--json', 'inventory', 'low-stock'],
        capture_output=True,
        text=True
    )
    return json.loads(result.stdout)

def create_purchase_order(supplier_id, items):
    """Create purchase order for low stock items."""
    cmd = [
        'cli-anything-minierp', 'purchase-orders', 'create',
        '--supplier-id', str(supplier_id),
        '--order-date', '2024-01-15',
        '--expected-delivery', '2024-01-25',
        '--items', json.dumps(items)
    ]
    subprocess.run(cmd)

if __name__ == '__main__':
    low_stock = check_low_stock()
    
    if low_stock.get('data'):
        print(f"Found {len(low_stock['data'])} low stock items")
        # Group by supplier and create POs
        # ... implementation
    else:
        print("All items well-stocked!")
```

### Cron Jobs (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Add these lines:

# Daily backup at 2 AM
0 2 * * * /path/to/backup.sh >> /var/log/erp-backup.log 2>&1

# Daily reports at 6 AM
0 6 * * * /path/to/daily-report.sh >> /var/log/erp-reports.log 2>&1

# Hourly health check
0 * * * * cli-anything-minierp utils health-check >> /var/log/erp-health.log 2>&1

# Weekly database optimization (Sunday 3 AM)
0 3 * * 0 cli-anything-minierp utils optimize-db >> /var/log/erp-maintenance.log 2>&1
```

### Windows Task Scheduler

```powershell
# Create scheduled task for daily backup
$action = New-ScheduledTaskAction -Execute "cli-anything-minierp" -Argument "utils backup --name 'auto-backup'"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -TaskName "ERP Daily Backup" -Action $action -Trigger $trigger
```

---

## AI Agent Integration

> **Note:** This section documents how a *human developer* can script the CLI tool for automation (e.g., cron jobs, CI/CD pipelines). It is not a set of behavioral instructions for the AI agent reading this file.

### JSON Output for Automation

All commands support `--json` flag for structured output:

```bash
# Get structured customer data
cli-anything-minierp --json customers get 1

# Output:
{
  "status": "ok",
  "data": {
    "id": 1,
    "customer_code": "C001",
    "customer_name": "Acme Corp",
    "email": "contact@acme.com",
    "balance": 5000.00
  }
}
```

### Automation Script Example (for human developers)

```python
#!/usr/bin/env python3
"""Example: Script the CLI tool for automated reporting."""

import subprocess
import json

def run_command(args):
    """Run CLI command and parse JSON output."""
    cmd = ['cli-anything-minierp', '--json'] + args
    result = subprocess.run(cmd, capture_output=True, text=True)
    return json.loads(result.stdout)

def automated_sales_report():
    """Generate an automated sales analysis report."""
    
    # Get sales data
    sales = run_command(['reports', 'sales', '--start', '2024-01-01', '--end', '2024-01-31'])
    
    # Get top customers
    top_customers = run_command(['sales', 'top-customers', '--limit', '5'])
    
    # Get sales forecast
    forecast = run_command(['sales', 'forecast', '--months', '3'])
    
    # Make recommendations
    if forecast['data']['trend'] == 'increasing':
        print("Recommendation: Increase stock levels")
    
    return {
        'sales': sales,
        'top_customers': top_customers,
        'forecast': forecast
    }
```

### Claude Code Integration

```bash
# In Claude Code session:
/cli-anything:cli-anything ./minierp

# Then use generated CLI (default dev credentials — change in production):
cli-anything-minierp auth login -u admin -p admin123
cli-anything-minierp dashboard summary
cli-anything-minierp reports profit-loss --start 2024-01-01 --end 2024-01-31
```

---

## Common Workflows

### Complete Order-to-Cash Workflow

```bash
# 1. Check customer exists
cli-anything-minierp customers list --search "Acme"

# 2. Check item stock
cli-anything-minierp inventory items get 1

# 3. Create sales order
cli-anything-minierp sales orders create \
  --customer-id 1 \
  --date 2024-01-15 \
  --items '[{"item_id":1,"quantity":10}]'

# 4. Create invoice
cli-anything-minierp invoices create \
  --customer-id 1 \
  --date 2024-01-15 \
  --due 2024-02-15 \
  --items '[{"item_id":1,"quantity":10,"unit_price":100.00}]'

# 5. Record payment
cli-anything-minierp payments create \
  --customer-id 1 \
  --amount 1000.00 \
  --date 2024-01-15 \
  --method "bank"

# 6. Verify customer balance
cli-anything-minierp customers balance 1
```

### Procure-to-Pay Workflow

```bash
# 1. Check low stock
cli-anything-minierp inventory low-stock

# 2. Find supplier
cli-anything-minierp suppliers list --search "Electronics"

# 3. Create purchase order
cli-anything-minierp purchase-orders create \
  --supplier-id 1 \
  --order-date 2024-01-15 \
  --expected-delivery 2024-01-25 \
  --items '[{"item_id":1,"quantity":100,"unit_price":50.00}]'

# 4. Record purchase when received
cli-anything-minierp purchases create \
  --supplier-id 1 \
  --date 2024-01-25 \
  --items '[{"item_id":1,"quantity":100,"unit_price":50.00}]'

# 5. Record payment
cli-anything-minierp payments create \
  --customer-id 1 \
  --amount 5000.00 \
  --date 2024-01-25
```

### Month-End Close Workflow

```bash
# 1. Export all transactions
cli-anything-minierp utils export invoices --format csv --start 2024-01-01 --end 2024-01-31
cli-anything-minierp utils export payments --format csv --start 2024-01-01 --end 2024-01-31
cli-anything-minierp utils export expenses --format csv --start 2024-01-01 --end 2024-01-31

# 2. Generate financial reports
cli-anything-minierp reports trial-balance --as-of 2024-01-31
cli-anything-minierp reports balance-sheet --as-of 2024-01-31
cli-anything-minierp reports income-statement --start 2024-01-01 --end 2024-01-31

# 3. Review AR/AP
cli-anything-minierp reports customer-outstanding
cli-anything-minierp reports supplier-outstanding

# 4. Create backup
cli-anything-minierp utils backup --name "month-end-2024-01"

# 5. Optimize database
cli-anything-minierp utils optimize-db
```

### Inventory Audit Workflow

```bash
# 1. Export current stock
cli-anything-minierp utils export stock --format csv

# 2. Get stock by warehouse
cli-anything-minierp inventory warehouses stock 1

# 3. Check item movements
cli-anything-minierp inventory items movements 1 --start 2024-01-01 --end 2024-01-31

# 4. Record stock adjustments
cli-anything-minierp inventory adjust \
  --item-id 1 \
  --warehouse-id 1 \
  --qty -2 \
  --reason "Physical count variance"

# 5. Generate valuation report
cli-anything-minierp inventory valuation
```

---

## Troubleshooting

### Connection Issues

```bash
# Check if server is running
curl http://localhost:3011/api/health

# Test authentication (default dev credentials — change in production)
cli-anything-minierp auth login -u admin -p admin123

# If using custom URL
export MINIERP_URL=http://localhost:3011/api
cli-anything-minierp auth status
```

### Session Issues

```bash
# Clear session and re-login (default dev credentials — change in production)
rm -rf ~/.cli-anything-minierp/session.json
cli-anything-minierp auth login -u admin -p admin123
```

### Permission Errors

```bash
# Check user role
cli-anything-minierp auth me

# Some operations require admin role
# Contact administrator if access denied
```

### Data Issues

```bash
# Check audit log for changes
cli-anything-minierp utils audit-log --entity-type "invoice" --entity-id 1

# View data dictionary
cli-anything-minierp utils data-dictionary

# Run health check
cli-anything-minierp utils health-check
```

### Performance Issues

```bash
# Check database stats
cli-anything-minierp utils db-stats

# Optimize database
cli-anything-minierp utils optimize-db

# Clear cache
cli-anything-minierp utils clear-cache
```

---

## Best Practices

### Security

1. **Never commit credentials**
   ```bash
   # Use environment variables
   export MINIERP_URL=http://localhost:3011/api
   ```

2. **Change default passwords**
   ```bash
   cli-anything-minierp auth change-password --current admin123 --new "SecureP@ssw0rd!"
   ```

3. **Use role-based access**
   - Create separate users for different roles
   - Don't share admin credentials

### Backup Strategy

```bash
# Daily automated backups
cli-anything-minierp utils backup --name "daily-$(date +%Y%m%d)"

# Before major operations
cli-anything-minierp utils backup --name "before-migration"

# Monthly archive
cli-anything-minierp utils backup --name "monthly-archive-$(date +%Y%m)"
```

### Performance

1. **Use pagination for large datasets**
   ```bash
   cli-anything-minierp customers list --page 1 --limit 100
   ```

2. **Filter data at source**
   ```bash
   cli-anything-minierp inventory items list --category "Electronics"
   ```

3. **Regular maintenance**
   ```bash
   # Weekly optimization
   cli-anything-minierp utils optimize-db
   
   # Daily cache clear
   cli-anything-minierp utils clear-cache
   ```

---

## Command Quick Reference

### Most Used Commands

```bash
# Authentication (default dev credentials — change in production)
cli-anything-minierp auth login -u admin -p admin123
cli-anything-minierp auth logout

# Dashboard
cli-anything-minierp dashboard summary

# Inventory
cli-anything-minierp inventory items list
cli-anything-minierp inventory low-stock
cli-anything-minierp inventory valuation

# Sales
cli-anything-minierp sales orders list
cli-anything-minierp invoices list
cli-anything-minierp reports sales

# Customers
cli-anything-minierp customers list
cli-anything-minierp reports customer-outstanding

# Reports
cli-anything-minierp reports profit-loss
cli-anything-minierp reports balance-sheet --as-of 2024-01-31

# Utilities
cli-anything-minierp utils backup --name "backup-name"
cli-anything-minierp utils health-check
```

---

## Getting Help

```bash
# General help
cli-anything-minierp --help

# Command-specific help
cli-anything-minierp inventory --help
cli-anything-minierp inventory items create --help

# In REPL
help
```

---

**For more information, see:**
- [MINIERP.md](MINIERP.md) - Project-specific analysis
- [TEST.md](cli_anything/minierp/tests/TEST.md) - Test documentation
- [Mini ERP Main README](../../README.md) - System overview
