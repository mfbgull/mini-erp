import express from 'express';
const router = express.Router();
import employeeController from '../controllers/employeeController';
import { authenticateToken } from '../middleware/auth';
import { uploadEmployeeDoc } from '../middleware/upload';
import { employeeDocsDir } from '../middleware/upload';
import path from 'path';

// All employee routes require authentication
router.use(authenticateToken);

router.get('/', employeeController.getEmployees);
router.get('/next-code', employeeController.getNextEmployeeCode);
router.get('/:id', employeeController.getEmployee);
router.post('/', employeeController.createEmployee);
router.put('/:id', employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);

// Salary payment routes
router.post('/:id/salary/pay', employeeController.paySalary);
router.get('/:id/salary/history', employeeController.getSalaryHistory);

// Document sub-routes
router.get('/:id/documents', employeeController.getEmployeeDocuments);
router.post('/:id/documents', uploadEmployeeDoc.single('file'), employeeController.addEmployeeDocument);
router.delete('/:id/documents/:docId', employeeController.removeEmployeeDocument);

// Serve uploaded document files
router.get('/:id/documents/file/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(employeeDocsDir, filename);
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).json({ success: false, error: 'File not found' });
    }
  });
});

export default router;
