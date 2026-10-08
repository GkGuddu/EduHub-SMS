import { FeeStatus } from '@eduhub/shared';

export function calculateLineItemsSubtotal(
  items: Array<{ amount: number }>
): number {
  if (!items || items.length === 0) return 0;
  return items.reduce(
    (sum, item) => sum + Math.max(0, Math.round(item.amount || 0)),
    0
  );
}

export function calculateConcessionAmount(
  subtotal: number,
  discountType: 'fixed' | 'percentage',
  discountValue: number
): number {
  if (subtotal <= 0 || discountValue <= 0) return 0;

  let calculated = 0;
  if (discountType === 'percentage') {
    const cappedPercent = Math.min(100, Math.max(0, discountValue));
    calculated = Math.round((subtotal * cappedPercent) / 100);
  } else {
    calculated = Math.round(discountValue);
  }

  return Math.min(subtotal, Math.max(0, calculated));
}

export function deriveInvoiceStatus(
  totalAmount: number,
  paidAmount: number,
  dueDate: string
): FeeStatus {
  const balance = Math.max(0, totalAmount - paidAmount);

  if (balance === 0 && totalAmount >= 0) {
    return 'paid';
  }

  if (paidAmount > 0) {
    return 'partially paid';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDate + 'T23:59:59.999Z');
  if (!isNaN(due.getTime()) && due.getTime() < today.getTime()) {
    return 'overdue';
  }

  return 'pending';
}

export function generateReceiptNumber(year?: number): string {
  const y = year || new Date().getFullYear();
  const timestampSuffix = Date.now().toString().slice(-4);
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `REC-${y}-${timestampSuffix}${randomSuffix}`;
}

export function generateInvoiceNumber(
  year?: number,
  sequenceNumber?: number
): string {
  const y = year || new Date().getFullYear();
  const seq = (sequenceNumber || Math.floor(1000 + Math.random() * 9000))
    .toString()
    .padStart(5, '0');
  return `INV-${y}-${seq}`;
}

function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export function formatDefaultersCsv(defaulters: any[]): string {
  const headers = [
    'Invoice Number',
    'Student Name',
    'Admission Number',
    'Class',
    'Section',
    'Guardian Name',
    'Guardian Phone',
    'Fee Title',
    'Total Amount (INR)',
    'Paid Amount (INR)',
    'Due Balance (INR)',
    'Due Date',
    'Overdue Days',
    'Status',
  ];

  const rows = defaulters.map((d) => [
    escapeCsvCell(d.invoiceNumber),
    escapeCsvCell(d.studentName),
    escapeCsvCell(d.admissionNumber),
    escapeCsvCell(d.className),
    escapeCsvCell(d.section),
    escapeCsvCell(d.parentName || 'N/A'),
    escapeCsvCell(d.parentPhone || 'N/A'),
    escapeCsvCell(d.title),
    escapeCsvCell(d.totalAmount),
    escapeCsvCell(d.paidAmount),
    escapeCsvCell(d.balance),
    escapeCsvCell(d.dueDate),
    escapeCsvCell(d.overdueDays),
    escapeCsvCell(d.status),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

export function formatDailyFeeBookCsv(
  records: any[],
  selectedDate: string
): string {
  const headers = [
    'Receipt Number',
    'Invoice Number',
    'Payment Date',
    'Student Name',
    'Admission Number',
    'Class',
    'Section',
    'Amount (INR)',
    'Payment Mode',
    'Transaction Ref',
    'Cashier / Staff',
    'Remarks',
  ];

  const rows = records.map((r) => [
    escapeCsvCell(r.receiptNumber),
    escapeCsvCell(r.invoiceNumber),
    escapeCsvCell(r.paymentDate),
    escapeCsvCell(r.studentName),
    escapeCsvCell(r.admissionNumber || 'N/A'),
    escapeCsvCell(r.className),
    escapeCsvCell(r.section),
    escapeCsvCell(r.amount),
    escapeCsvCell(r.paymentMethod),
    escapeCsvCell(r.transactionRef || 'N/A'),
    escapeCsvCell(r.recordedByName),
    escapeCsvCell(r.notes || ''),
  ]);

  const summaryRow = [
    escapeCsvCell('Total Collections for ' + selectedDate),
    '""',
    '""',
    '""',
    '""',
    '""',
    '""',
    escapeCsvCell(records.reduce((acc, r) => acc + (r.amount || 0), 0)),
    '""',
    '""',
    '""',
    '""',
  ];

  return [
    headers.join(','),
    ...rows.map((r) => r.join(',')),
    summaryRow.join(','),
  ].join('\r\n');
}
