import { body, param, validationResult, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to handle validation errors
 */
export function handleValidationErrors(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.type === 'field' ? err.path : err.type,
      message: err.msg,
      value: err.type === 'field' ? err.value : undefined
    }));

    res.status(400).json({
      error: 'Validation failed',
      details: formattedErrors
    });
    return;
  }
  next();
}

// ============================================================================
// Authentication Validations
// ============================================================================

export const validateLogin: ValidationChain[] = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .escape(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 1, max: 128 })
    .withMessage('Password is too long')
];

export const validateChangePassword: ValidationChain[] = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6, max: 128 })
    .withMessage('New password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one letter and one number')
];

// ============================================================================
// Inventory Validations
// ============================================================================

export const validateCreateItem: ValidationChain[] = [
  body('item_code')
    .trim()
    .notEmpty()
    .withMessage('Item code is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Item code must be between 1 and 50 characters')
    .matches(/^[a-zA-Z0-9-_]+$/)
    .withMessage('Item code can only contain letters, numbers, hyphens, and underscores')
    .escape(),
  body('item_name')
    .trim()
    .notEmpty()
    .withMessage('Item name is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Item name must be between 1 and 200 characters')
    .escape(),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category must be less than 100 characters')
    .escape(),
  body('unit_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a positive number'),
  body('cost_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost price must be a positive number'),
  body('reorder_level')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Reorder level must be a positive integer'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters')
    .escape()
];

export const validateUpdateItem: ValidationChain[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid item ID'),
  ...validateCreateItem
];

// ============================================================================
// Customer Validations
// ============================================================================

export const validateCreateCustomer: ValidationChain[] = [
  body('customer_name')
    .trim()
    .notEmpty()
    .withMessage('Customer name is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Customer name must be between 1 and 200 characters')
    .escape(),
  body('customer_code')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Customer code must be less than 50 characters')
    .matches(/^[a-zA-Z0-9-_]*$/)
    .withMessage('Customer code can only contain letters, numbers, hyphens, and underscores')
    .escape(),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail()
    .escape(),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Phone number must be less than 50 characters')
    .escape(),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must be less than 500 characters')
    .escape(),
  body('credit_limit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Credit limit must be a positive number'),
  body('payment_terms_days')
    .optional()
    .isInt({ min: 0, max: 365 })
    .withMessage('Payment terms must be between 0 and 365 days')
];

// ============================================================================
// Invoice Validations
// ============================================================================

export const validateCreateInvoice: ValidationChain[] = [
  body('customer_id')
    .notEmpty()
    .withMessage('Customer is required')
    .isInt({ min: 1 })
    .withMessage('Invalid customer ID'),
  body('invoice_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('due_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  body('items.*.item_id')
    .isInt({ min: 1 })
    .withMessage('Invalid item ID'),
  body('items.*.quantity')
    .isFloat({ min: 0.01 })
    .withMessage('Quantity must be greater than 0'),
  body('items.*.unit_price')
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a positive number'),
  body('discount_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount amount must be a positive number'),
  body('tax_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Tax amount must be a positive number')
];

// ============================================================================
// Supplier Validations
// ============================================================================

export const validateCreateSupplier: ValidationChain[] = [
  body('supplier_name')
    .trim()
    .notEmpty()
    .withMessage('Supplier name is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Supplier name must be between 1 and 200 characters')
    .escape(),
  body('supplier_code')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Supplier code must be less than 50 characters')
    .escape(),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail()
    .escape(),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Phone number must be less than 50 characters')
    .escape()
];

// ============================================================================
// Expense Validations
// ============================================================================

export const validateCreateExpense: ValidationChain[] = [
  body('expense_date')
    .notEmpty()
    .withMessage('Expense date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('category_id')
    .notEmpty()
    .withMessage('Category is required')
    .isInt({ min: 1 })
    .withMessage('Invalid category ID'),
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters')
    .escape()
];

// ============================================================================
// Generic ID Parameter Validation
// ============================================================================

export const validateIdParam = (paramName: string = 'id'): ValidationChain[] => [
  param(paramName)
    .isInt({ min: 1 })
    .withMessage(`Invalid ${paramName}`)
];
