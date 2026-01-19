import fs from 'fs';

const filePath = '/c/projects/minierp/client/src/pages/customers/CustomerDetailPage.jsx';
const content = fs.readFileSync(filePath, 'utf8');

// Pattern to match onGridReady handlers
const pattern = /onGridReady=\{\(params\) => \{\s+params\.api\.sizeColumnsToFit\(\{\s+defaultMinWidth: \d+,\s+columnLimits: \[\]\s+\}\);\s+\}\}/g;

const replacement = `onGridReady={(params) => {
              const fitGrid = () => {
                const container = params.api.getContainer();
                if (container && container.offsetWidth > 0) {
                  params.api.sizeColumnsToFit({
                    defaultMinWidth: 100,
                    columnLimits: []
                  });
                }
              };
              fitGrid();
              setTimeout(fitGrid, 100);
            }}`;

const newContent = content.replace(pattern, replacement);
fs.writeFileSync(filePath, newContent);
console.log('Fixed AG Grid handlers');
