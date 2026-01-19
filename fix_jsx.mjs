import fs from 'fs';

const content = fs.readFileSync('/c/projects/minierp/client/src/pages/customers/CustomerDetailPage.jsx', 'utf8');
let newContent = content;

// 1. Update OverviewTab function definition
newContent = newContent.replace(
  'function OverviewTab({ customer, invoices, ledger, payments })',
  'function OverviewTab({ customer, invoices, ledger, payments, setActiveTab })'
);

// 2. Add setActiveTab prop to OverviewTab call
const oldOverviewCall = `            <OverviewTab
              customer={customer}
              invoices={invoices}
              ledger={ledger}
              payments={payments}
            />`;

const newOverviewCall = `            <OverviewTab
              customer={customer}
              invoices={invoices}
              ledger={ledger}
              payments={payments}
              setActiveTab={setActiveTab}
            />`;

newContent = newContent.replace(oldOverviewCall, newOverviewCall);

// 3. Add Quick Access section
const quickAccessSection = `      {/* Quick Access Cards */}
      <div className="overview-quick-access">
        <h3 className="section-title">
          <FileText size={18} />
          Quick Access
        </h3>
        <div className="quick-access-grid">
          <div className="quick-access-card" onClick={() => setActiveTab('invoices')}>
            <div className="quick-access-icon">
              <Receipt size={24} />
            </div>
            <div className="quick-access-content">
              <span className="quick-access-value">{invoices.length}</span>
              <span className="quick-access-label">Invoices</span>
            </div>
          </div>
          <div className="quick-access-card" onClick={() => setActiveTab('ledger')}>
            <div className="quick-access-icon">
              <FileText size={24} />
            </div>
            <div className="quick-access-content">
              <span className="quick-access-value">{ledger.length}</span>
              <span className="quick-access-label">Ledger</span>
            </div>
          </div>
          <div className="quick-access-card" onClick={() => setActiveTab('payments')}>
            <div className="quick-access-icon">
              <CreditCard size={24} />
            </div>
            <div className="quick-access-content">
              <span className="quick-access-value">{payments.length}</span>
              <span className="quick-access-label">Payments</span>
            </div>
          </div>
        </div>
      </div>

`;

newContent = newContent.replace('\n      <div className="overview-columns">', '\n' + quickAccessSection + '<div className="overview-columns">');

fs.writeFileSync('/c/projects/minierp/client/src/pages/customers/CustomerDetailPage.jsx', newContent);
console.log('File updated successfully');
