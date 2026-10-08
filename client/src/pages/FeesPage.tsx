import React, { useState, useId } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feesApi, academicsApi, parentsApi, financeApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common';
import { Modal } from '../components/common';
import {
  CreditCard,
  Plus,
  Receipt,
  Search,
  Filter,
  Printer,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Calendar,
  Download,
  DollarSign,
  TrendingUp,
  Clock,
  Layers,
  FileText,
  BookOpen,
  UserCheck,
  Building,
  Check,
  X,
  RefreshCw,
  ShieldAlert,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react';
import { PERMISSIONS } from '@eduhub/shared';

export const FeesPage: React.FC = () => {
  const { user, school, hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<string>('overview');

  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [selectedChildId, setSelectedChildId] = useState<string>('');

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentMethod: 'cash',
    transactionRef: '',
    notes: '',
  });

  const [viewReceiptNum, setViewReceiptNum] = useState<string | null>(null);

  const [isCreateHeadOpen, setIsCreateHeadOpen] = useState(false);
  const [headForm, setHeadForm] = useState({
    title: '',
    amount: 0,
    frequency: 'yearly',
    description: '',
    classSectionId: '',
    academicYearId: '',
  });

  const [isEditHeadOpen, setIsEditHeadOpen] = useState(false);
  const [editHeadForm, setEditHeadForm] = useState({
    _id: '',
    title: '',
    amount: 0,
    frequency: 'yearly',
    description: '',
    classSectionId: '',
    academicYearId: '',
  });

  const [isDeleteHeadOpen, setIsDeleteHeadOpen] = useState(false);
  const [selectedDeleteHead, setSelectedDeleteHead] = useState<any>(null);

  const [isCreateStructureOpen, setIsCreateStructureOpen] = useState(false);
  const [structureForm, setStructureForm] = useState({
    name: '',
    classSectionId: '',
    academicYearId: '',
    feeHeadIds: [] as string[],
  });

  const [isEditStructureOpen, setIsEditStructureOpen] = useState(false);
  const [editStructureForm, setEditStructureForm] = useState({
    _id: '',
    name: '',
    classSectionId: '',
    academicYearId: '',
    feeHeadIds: [] as string[],
    isActive: true,
  });

  const [isDeleteStructureOpen, setIsDeleteStructureOpen] = useState(false);
  const [selectedDeleteStructure, setSelectedDeleteStructure] = useState<any>(null);

  const [isCreateConcessionOpen, setIsCreateConcessionOpen] = useState(false);
  const [concessionForm, setConcessionForm] = useState({
    studentId: '',
    type: 'merit',
    discountType: 'fixed',
    discountValue: 0,
    reason: '',
    academicYearId: '',
  });

  const [feeBookDate, setFeeBookDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [feeBookMethod, setFeeBookMethod] = useState('');

  const [defaulterClass, setDefaulterClass] = useState('');
  const [defaulterSearch, setDefaulterSearch] = useState('');

  const [isViewInvoiceOpen, setIsViewInvoiceOpen] = useState(false);
  const [selectedViewInvoice, setSelectedViewInvoice] = useState<any>(null);

  const [isEditInvoiceOpen, setIsEditInvoiceOpen] = useState(false);
  const [editInvoiceForm, setEditInvoiceForm] = useState<any>({
    _id: '',
    invoiceNumber: '',
    title: '',
    dueDate: '',
    items: [{ title: '', amount: 0 }],
    totalAmount: 0,
    paidAmount: 0,
    concessionAmount: 0,
    notes: '',
    status: '',
  });

  const [isDeleteInvoiceOpen, setIsDeleteInvoiceOpen] = useState(false);
  const [selectedDeleteInvoice, setSelectedDeleteInvoice] = useState<any>(null);

  const canCollect =
    user?.role === 'admin' || hasPermission(PERMISSIONS.FEES_COLLECT);
  const canEdit =
    user?.role === 'admin' || hasPermission(PERMISSIONS.FEES_EDIT);
  const canViewReceipt =
    user?.role === 'admin' ||
    hasPermission(PERMISSIONS.FEES_RECEIPT) ||
    hasPermission(PERMISSIONS.FEES_VIEW);
  const canViewFinance =
    user?.role === 'admin' || hasPermission(PERMISSIONS.FINANCE_VIEW);
  const canManageFinance =
    user?.role === 'admin' || hasPermission(PERMISSIONS.FINANCE_MANAGE);

  const [financeStartDate, setFinanceStartDate] = useState('');
  const [financeEndDate, setFinanceEndDate] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('');
  const [isRecordExpenseOpen, setIsRecordExpenseOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: 'supplies',
    title: '',
    amount: 0,
    payee: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    description: '',
    attachmentName: '',
  });

  const { data: academicYearsData } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => academicsApi.getAcademicYears(),
    enabled: user?.role === 'admin' || user?.role === 'teacher',
  });

  const currentAcademicYear =
    academicYearsData?.academicYears?.find((ay: any) => ay.isCurrent) ||
    academicYearsData?.academicYears?.[0];

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => academicsApi.getClasses(),
    enabled: user?.role === 'admin' || user?.role === 'teacher',
  });

  const { data: parentProfileData } = useQuery({
    queryKey: ['parent-profile-fees'],
    queryFn: () => parentsApi.getParentById(user?._id || ''),
    enabled: user?.role === 'parent',
  });

  const linkedChildren = parentProfileData?.parent?.linkedStudents || [];
  const activeChild =
    linkedChildren.find(
      (c: any) =>
        c.studentId === selectedChildId || c.studentUserId === selectedChildId
    ) || linkedChildren[0];
  const activeChildStudentId =
    activeChild?.studentUserId || activeChild?.studentId;

  const { data: invoicesData, isLoading: loadingInvoices } = useQuery({
    queryKey: [
      'invoices',
      statusFilter,
      classFilter,
      search,
      page,
      user?.role === 'parent' ? activeChildStudentId : undefined,
    ],
    queryFn: () =>
      feesApi.getInvoices({
        status: statusFilter || undefined,
        classSectionId: classFilter || undefined,
        studentId: user?.role === 'parent' ? activeChildStudentId : undefined,
        search: search || undefined,
        page,
        limit: 15,
      }),
  });

  const { data: dashboardData, isLoading: loadingDashboard } = useQuery({
    queryKey: ['fees-dashboard'],
    queryFn: () => feesApi.getCollectionDashboard(),
    enabled:
      activeTab === 'overview' &&
      (user?.role === 'admin' || user?.role === 'teacher'),
  });

  const { data: feeHeadsData, isLoading: loadingHeads } = useQuery({
    queryKey: ['fee-heads'],
    queryFn: () => feesApi.getFeeHeads(),
    enabled: activeTab === 'heads_structures',
  });

  const { data: feeStructuresData, isLoading: loadingStructures } = useQuery({
    queryKey: ['fee-structures'],
    queryFn: () => feesApi.getFeeStructures(),
    enabled: activeTab === 'heads_structures',
  });

  const { data: concessionsData, isLoading: loadingConcessions } = useQuery({
    queryKey: ['fee-concessions'],
    queryFn: () => feesApi.getConcessions(),
    enabled: activeTab === 'concessions',
  });

  const { data: defaultersData, isLoading: loadingDefaulters } = useQuery({
    queryKey: ['defaulters-report', defaulterClass, defaulterSearch],
    queryFn: () =>
      feesApi.getDefaultersReport({
        classSectionId: defaulterClass || undefined,
        search: defaulterSearch || undefined,
      }),
    enabled: activeTab === 'defaulters',
  });

  const { data: feeBookData, isLoading: loadingFeeBook } = useQuery({
    queryKey: ['daily-fee-book', feeBookDate, feeBookMethod],
    queryFn: () =>
      feesApi.getDailyFeeBook({
        date: feeBookDate,
        paymentMethod: feeBookMethod || undefined,
      }),
    enabled: activeTab === 'daily_book',
  });

  const { data: receiptData, isLoading: loadingReceipt } = useQuery({
    queryKey: ['receipt', viewReceiptNum],
    queryFn: () => feesApi.getReceipt(viewReceiptNum!),
    enabled: !!viewReceiptNum,
  });

  const payMutation = useMutation({
    mutationFn: ({
      payload,
      idempotencyKey,
    }: {
      payload: any;
      idempotencyKey: string;
    }) => feesApi.recordPayment(payload, idempotencyKey),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['fees-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['daily-fee-book'] });
      queryClient.invalidateQueries({ queryKey: ['defaulters-report'] });
      setIsPayModalOpen(false);
      setViewReceiptNum(res.receiptNumber);
    },
    onError: (err: any) => alert(err.message || 'Failed to record payment'),
  });

  const createHeadMutation = useMutation({
    mutationFn: (payload: any) => feesApi.createFeeHead(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-heads'] });
      setIsCreateHeadOpen(false);
      setHeadForm({
        title: '',
        amount: 0,
        frequency: 'yearly',
        description: '',
        classSectionId: '',
        academicYearId: '',
      });
    },
    onError: (err: any) => alert(err.message || 'Failed to create fee head'),
  });

  const updateHeadMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      feesApi.updateFeeHead(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-heads'] });
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
      setIsEditHeadOpen(false);
    },
    onError: (err: any) => alert(err.message || 'Failed to update fee head'),
  });

  const deleteHeadMutation = useMutation({
    mutationFn: (id: string) => feesApi.deleteFeeHead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-heads'] });
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
      setIsDeleteHeadOpen(false);
      setSelectedDeleteHead(null);
    },
    onError: (err: any) => alert(err.message || 'Failed to delete fee head'),
  });

  const createStructureMutation = useMutation({
    mutationFn: (payload: any) => feesApi.createFeeStructure(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
      setIsCreateStructureOpen(false);
      setStructureForm({
        name: '',
        classSectionId: '',
        academicYearId: '',
        feeHeadIds: [],
      });
    },
    onError: (err: any) => alert(err.message || 'Failed to create fee structure'),
  });

  const updateStructureMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      feesApi.updateFeeStructure(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
      setIsEditStructureOpen(false);
    },
    onError: (err: any) => alert(err.message || 'Failed to update fee structure'),
  });

  const deleteStructureMutation = useMutation({
    mutationFn: (id: string) => feesApi.deleteFeeStructure(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
      setIsDeleteStructureOpen(false);
      setSelectedDeleteStructure(null);
    },
    onError: (err: any) => alert(err.message || 'Failed to delete fee structure'),
  });

  const createConcessionMutation = useMutation({
    mutationFn: (payload: any) => feesApi.createConcession(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-concessions'] });
      setIsCreateConcessionOpen(false);
      setConcessionForm({
        studentId: '',
        type: 'merit',
        discountType: 'fixed',
        discountValue: 0,
        reason: '',
        academicYearId: '',
      });
    },
    onError: (err: any) =>
      alert(err.message || 'Failed to submit concession request'),
  });

  const updateConcessionStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      note,
    }: {
      id: string;
      status: 'approved' | 'rejected';
      note?: string;
    }) => feesApi.updateConcessionStatus(id, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-concessions'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (err: any) =>
      alert(err.message || 'Failed to update concession status'),
  });

  const { data: financeSummaryData, isLoading: loadingFinanceSummary } =
    useQuery({
      queryKey: ['finance-summary', financeStartDate, financeEndDate],
      queryFn: () =>
        financeApi.getFinanceSummary({
          startDate: financeStartDate || undefined,
          endDate: financeEndDate || undefined,
        }),
      enabled:
        (user?.role === 'admin' || canViewFinance) &&
        activeTab === 'finance_expenses',
    });

  const { data: expensesData, isLoading: loadingExpenses } = useQuery({
    queryKey: [
      'expenses-list',
      expenseCategoryFilter,
      financeStartDate,
      financeEndDate,
    ],
    queryFn: () =>
      financeApi.getExpenses({
        category: expenseCategoryFilter || undefined,
        startDate: financeStartDate || undefined,
        endDate: financeEndDate || undefined,
      }),
    enabled:
      (user?.role === 'admin' || canViewFinance) &&
      activeTab === 'finance_expenses',
  });

  const createExpenseMutation = useMutation({
    mutationFn: (payload: any) => financeApi.createExpense(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-list'] });
      setIsRecordExpenseOpen(false);
      setExpenseForm({
        category: 'supplies',
        title: '',
        amount: 0,
        payee: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'bank_transfer',
        description: '',
        attachmentName: '',
      });
    },
    onError: (err: any) => alert(err.message || 'Failed to record expense'),
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => financeApi.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-list'] });
    },
    onError: (err: any) => alert(err.message || 'Failed to delete expense'),
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      feesApi.updateInvoice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['fees-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['defaulters-report'] });
      setIsEditInvoiceOpen(false);
    },
    onError: (err: any) => alert(err.message || 'Failed to update invoice'),
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: (id: string) => feesApi.deleteInvoice(id),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['fees-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['defaulters-report'] });
      setIsDeleteInvoiceOpen(false);
      if (res?.cancelled) {
        alert(
          'Notice: Invoice had payment history and has been safely cancelled and archived rather than permanently deleted.'
        );
      }
    },
    onError: (err: any) => alert(err.message || 'Failed to delete invoice'),
  });

  const handleOpenView = (inv: any) => {
    setSelectedViewInvoice(inv);
    setIsViewInvoiceOpen(true);
  };

  const handleOpenEdit = (inv: any) => {
    setEditInvoiceForm({
      _id: inv._id,
      invoiceNumber: inv.invoiceNumber,
      title: inv.title || '',
      dueDate: inv.dueDate || '',
      items:
        inv.items && inv.items.length > 0
          ? inv.items.map((it: any) => ({
              title: it.title,
              amount: it.amount,
            }))
          : [
              {
                title: inv.title || 'Tuition Fee',
                amount: inv.totalAmount || 0,
              },
            ],
      totalAmount: inv.totalAmount || 0,
      paidAmount: inv.paidAmount || 0,
      concessionAmount: inv.concessionAmount || 0,
      notes: '',
      status: inv.status || 'pending',
    });
    setIsEditInvoiceOpen(true);
  };

  const handleOpenDelete = (inv: any) => {
    setSelectedDeleteInvoice(inv);
    setIsDeleteInvoiceOpen(true);
  };

  const handleSaveEditInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editInvoiceForm._id) return;
    updateInvoiceMutation.mutate({
      id: editInvoiceForm._id,
      data: {
        title: editInvoiceForm.title,
        dueDate: editInvoiceForm.dueDate,
        items: editInvoiceForm.items,
        notes: editInvoiceForm.notes,
      },
    });
  };

  const handleConfirmDeleteInvoice = () => {
    if (!selectedDeleteInvoice?._id) return;
    deleteInvoiceMutation.mutate(selectedDeleteInvoice._id);
  };

  const handleOpenEditHead = (head: any) => {
    setEditHeadForm({
      _id: head._id,
      title: head.title,
      amount: head.amount,
      frequency: head.frequency,
      description: head.description || '',
      classSectionId: head.classSectionId?._id || head.classSectionId || '',
      academicYearId: head.academicYearId?._id || head.academicYearId || '',
    });
    setIsEditHeadOpen(true);
  };

  const handleSaveEditHead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editHeadForm._id) return;
    updateHeadMutation.mutate({
      id: editHeadForm._id,
      payload: {
        title: editHeadForm.title,
        amount: Number(editHeadForm.amount),
        frequency: editHeadForm.frequency,
        description: editHeadForm.description,
        classSectionId: editHeadForm.classSectionId || undefined,
        academicYearId: editHeadForm.academicYearId || currentAcademicYear?._id,
      },
    });
  };

  const handleOpenDeleteHead = (head: any) => {
    setSelectedDeleteHead(head);
    setIsDeleteHeadOpen(true);
  };

  const handleConfirmDeleteHead = () => {
    if (!selectedDeleteHead?._id) return;
    deleteHeadMutation.mutate(selectedDeleteHead._id);
  };

  const handleOpenCreateStructure = () => {
    setStructureForm({
      name: '',
      classSectionId: classesData?.classes?.[0]?._id || '',
      academicYearId: currentAcademicYear?._id || '',
      feeHeadIds: [],
    });
    setIsCreateStructureOpen(true);
  };

  const handleSaveCreateStructure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!structureForm.classSectionId) {
      alert('Please select a class section for the fee structure.');
      return;
    }
    if (structureForm.feeHeadIds.length === 0) {
      alert('Please select at least one fee head.');
      return;
    }
    createStructureMutation.mutate({
      name: structureForm.name.trim(),
      classSectionId: structureForm.classSectionId,
      academicYearId: structureForm.academicYearId || currentAcademicYear?._id,
      feeHeadIds: structureForm.feeHeadIds,
    });
  };

  const handleOpenEditStructure = (struct: any) => {
    setEditStructureForm({
      _id: struct._id,
      name: struct.name,
      classSectionId: struct.classSectionId?._id || struct.classSectionId || '',
      academicYearId: struct.academicYearId?._id || struct.academicYearId || '',
      feeHeadIds: (struct.feeHeads || struct.feeHeadIds || []).map(
        (h: any) => h._id || h
      ),
      isActive: struct.isActive ?? true,
    });
    setIsEditStructureOpen(true);
  };

  const handleSaveEditStructure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStructureForm._id) return;
    if (editStructureForm.feeHeadIds.length === 0) {
      alert('Please select at least one fee head.');
      return;
    }
    updateStructureMutation.mutate({
      id: editStructureForm._id,
      payload: {
        name: editStructureForm.name.trim(),
        classSectionId: editStructureForm.classSectionId,
        academicYearId:
          editStructureForm.academicYearId || currentAcademicYear?._id,
        feeHeadIds: editStructureForm.feeHeadIds,
        isActive: editStructureForm.isActive,
      },
    });
  };

  const handleOpenDeleteStructure = (struct: any) => {
    setSelectedDeleteStructure(struct);
    setIsDeleteStructureOpen(true);
  };

  const handleConfirmDeleteStructure = () => {
    if (!selectedDeleteStructure?._id) return;
    deleteStructureMutation.mutate(selectedDeleteStructure._id);
  };

  const handleOpenPay = (inv: any) => {
    setSelectedInvoice(inv);
    setPaymentForm({
      amount: inv.balance,
      paymentMethod: 'cash',
      transactionRef: '',
      notes: '',
    });
    setIsPayModalOpen(true);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    const idempotencyKey = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    payMutation.mutate({
      payload: {
        invoiceId: selectedInvoice._id,
        amount: paymentForm.amount,
        paymentMethod: paymentForm.paymentMethod,
        transactionRef: paymentForm.transactionRef,
        notes: paymentForm.notes,
        idempotencyKey,
      },
      idempotencyKey,
    });
  };

  const handleExportDefaultersCsv = () => {
    const url = `/api/fees/reports/defaulters?export=csv${defaulterClass ? `&classSectionId=${defaulterClass}` : ''}`;
    window.open(url, '_blank');
  };

  const handleExportFeeBookCsv = () => {
    const url = `/api/fees/daily-book?export=csv&date=${feeBookDate}${feeBookMethod ? `&paymentMethod=${feeBookMethod}` : ''}`;
    window.open(url, '_blank');
  };

  if (user?.role === 'student' || user?.role === 'parent') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              {user.role === 'student'
                ? 'My School Fees & Receipts'
                : "Child's Fee Statements"}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Official invoices, payment history, and receipt downloads for
              Adiya School.
            </p>
          </div>
          {user.role === 'parent' && (linkedChildren?.length || 0) > 1 && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium">
                Select Child:
              </span>
              <select
                value={selectedChildId || activeChildStudentId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              >
                {linkedChildren.map((child: any) => {
                  const childVal = child.studentUserId || child.studentId;
                  return (
                    <option key={childVal} value={childVal}>
                      {child.name || child.studentName || 'Child'} ({child.className || 'Class'}
                      {child.section ? `-${child.section}` : ''})
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        {(() => {
          const invoices = invoicesData?.invoices || [];
          const totalFees = invoices.reduce((acc: number, inv: any) => acc + (inv.totalAmount || 0), 0);
          const totalPaid = invoices.reduce((acc: number, inv: any) => acc + (inv.paidAmount || 0), 0);
          const totalBalance = invoices.reduce((acc: number, inv: any) => acc + (inv.balance || 0), 0);
          const invoiceCount = invoices.length;
          return (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Total Billed
                </span>
                <span className="text-2xl font-black text-slate-800 mt-1 block">
                  ₹{totalFees.toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Across {invoiceCount} invoice{invoiceCount !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 shadow-sm">
                <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
                  Total Paid
                </span>
                <span className="text-2xl font-black text-emerald-800 mt-1 block">
                  ₹{totalPaid.toLocaleString()}
                </span>
                <span className="text-[11px] text-emerald-600 mt-0.5 block">
                  Settled fees
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 shadow-sm">
                <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider block">
                  Outstanding Balance
                </span>
                <span className="text-2xl font-black text-rose-800 mt-1 block">
                  ₹{totalBalance.toLocaleString()}
                </span>
                <span className="text-[11px] text-rose-600 mt-0.5 block">
                  Pending payment
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-200 shadow-sm">
                <span className="text-[11px] font-semibold text-brand-700 uppercase tracking-wider block">
                  Invoices Count
                </span>
                <span className="text-2xl font-black text-brand-800 mt-1 block">
                  {invoiceCount}
                </span>
                <span className="text-[11px] text-brand-600 mt-0.5 block">
                  {invoices.filter((i: any) => i.status === 'paid').length} fully cleared
                </span>
              </div>
            </div>
          );
        })()}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-semibold text-slate-800 text-sm">
              Issued Invoices
            </h3>
            <span className="text-xs text-slate-500">
              Total Invoices:{' '}
              <strong>{invoicesData?.invoices?.length || 0}</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Invoice No</th>
                  <th className="px-6 py-3.5">Fee Title</th>
                  <th className="px-6 py-3.5">Due Date</th>
                  <th className="px-6 py-3.5">Total Amount</th>
                  <th className="px-6 py-3.5">Paid Amount</th>
                  <th className="px-6 py-3.5">Balance</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingInvoices ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-12 text-center text-slate-400"
                    >
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
                      Loading your fee records...
                    </td>
                  </tr>
                ) : invoicesData?.invoices?.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-12 text-center text-slate-400"
                    >
                      No invoices currently assigned to your account.
                    </td>
                  </tr>
                ) : (
                  invoicesData?.invoices?.map((inv: any) => (
                    <tr
                      key={inv._id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono font-bold text-slate-700">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {inv.title}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {inv.dueDate}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        ₹{inv.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-emerald-600 font-bold">
                        ₹{inv.paidAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-rose-600 font-bold">
                        ₹{inv.balance.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <Badge status={inv.status} variant="fee" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenView(inv)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                            title="View Fee details"
                            aria-label="View Fee details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {inv.payments?.length > 0 && (
                            <button
                              onClick={() =>
                                setViewReceiptNum(
                                  inv.payments[inv.payments.length - 1]
                                    .receiptNumber
                                )
                              }
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors inline-flex items-center gap-1"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              Receipt
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {renderReceiptModal()}
        {renderViewFeeModal()}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Fee Management & Accounts
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-50 text-brand-700 border border-brand-200">
              {currentAcademicYear?.name || 'Academic Year'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Fee structure setup, student invoicing, payment collection, and
            audit ledgers for Adiya School.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          {canEdit && (
            <>
              <button
                onClick={() => setIsCreateHeadOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-brand-600" />
                Add Fee Head
              </button>
              <button
                onClick={() => setIsCreateConcessionOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                Grant Concession
              </button>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 border-b border-slate-200 pb-1 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview & Analytics', icon: TrendingUp },
          { id: 'invoices', label: 'Student Invoices', icon: FileText },
          {
            id: 'heads_structures',
            label: 'Fee Heads & Structures',
            icon: Layers,
          },
          {
            id: 'concessions',
            label: 'Concessions & Waivers',
            icon: UserCheck,
          },
          { id: 'defaulters', label: 'Defaulters Report', icon: AlertTriangle },
          { id: 'daily_book', label: 'Daily Fee Book', icon: BookOpen },
          ...(canViewFinance
            ? [
                {
                  id: 'finance_expenses',
                  label: 'Expenses & Finance Ledger',
                  icon: DollarSign,
                },
              ]
            : []),
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-1">
                  Gross Invoiced
                </span>
                <span className="text-2xl font-bold text-slate-800">
                  ₹{(dashboardData?.stats?.grossInvoiced || 0).toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">
                  {dashboardData?.stats?.totalInvoicesCount || 0} Total Invoices
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-1">
                  Total Collected
                </span>
                <span className="text-2xl font-bold text-emerald-600">
                  ₹
                  {(dashboardData?.stats?.totalCollected || 0).toLocaleString()}
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold block mt-1">
                  {dashboardData?.stats?.collectionRate || 0}% Collection Rate
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-1">
                  Outstanding Balance
                </span>
                <span className="text-2xl font-bold text-rose-600">
                  ₹
                  {(
                    dashboardData?.stats?.outstandingBalance || 0
                  ).toLocaleString()}
                </span>
                <span className="text-[11px] text-rose-600 font-medium block mt-1">
                  {dashboardData?.stats?.defaultersCount || 0} Defaulters
                  Pending
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-1">
                  Today's Collection
                </span>
                <span className="text-2xl font-bold text-indigo-600">
                  ₹
                  {(dashboardData?.stats?.todayCollected || 0).toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">
                  {dashboardData?.stats?.todayTransactionsCount || 0} Receipts
                  Today
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-brand-600" />
                Collection by Payment Mode
              </h3>
              <div className="space-y-3 pt-2">
                {[
                  'cash',
                  'online',
                  'cheque',
                  'dd',
                  'card',
                  'bank_transfer',
                  'other',
                ].map((method) => {
                  const data = dashboardData?.stats?.methodBreakdown?.[
                    method
                  ] || {
                    count: 0,
                    totalAmount: 0,
                  };
                  const percent =
                    dashboardData?.stats?.totalCollected && data.totalAmount
                      ? Math.round(
                          (data.totalAmount /
                            dashboardData.stats.totalCollected) *
                            100
                        )
                      : 0;

                  return (
                    <div key={method} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                        <span className="capitalize">
                          {method.replace('_', ' ')}
                        </span>
                        <span className="font-bold">
                          ₹{data.totalAmount.toLocaleString()} ({data.count})
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  Recent Transactions
                </h3>
                <button
                  onClick={() => setActiveTab('daily_book')}
                  className="text-xs text-brand-600 font-semibold hover:underline"
                >
                  View Full Daily Fee Book &rarr;
                </button>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3">Receipt No</th>
                      <th className="px-5 py-3">Invoice No</th>
                      <th className="px-5 py-3">Method</th>
                      <th className="px-5 py-3">Amount</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingDashboard ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-8 text-center text-slate-400"
                        >
                          Loading recent activity...
                        </td>
                      </tr>
                    ) : dashboardData?.stats?.recentPayments?.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-8 text-center text-slate-400"
                        >
                          No transactions recorded yet.
                        </td>
                      </tr>
                    ) : (
                      dashboardData?.stats?.recentPayments?.map((p: any) => (
                        <tr
                          key={p.receiptNumber}
                          className="hover:bg-slate-50/70"
                        >
                          <td className="px-5 py-3 font-mono font-bold text-slate-700">
                            {p.receiptNumber}
                          </td>
                          <td className="px-5 py-3 font-mono text-slate-600">
                            {p.invoiceNumber}
                          </td>
                          <td className="px-5 py-3 capitalize font-medium text-slate-700">
                            {p.paymentMethod}
                          </td>
                          <td className="px-5 py-3 font-bold text-emerald-600">
                            ₹{p.amount.toLocaleString()}
                          </td>
                          <td className="px-5 py-3 text-slate-500">
                            {new Date(p.paymentDate).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => setViewReceiptNum(p.receiptNumber)}
                              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                            >
                              Receipt
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
            <div className="flex flex-1 items-center gap-3 w-full md:w-auto flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search invoice number, student name..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>
              <div className="w-36">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-none cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="partially paid">Partially Paid</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div className="w-40">
                <select
                  value={classFilter}
                  onChange={(e) => {
                    setClassFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-none cursor-pointer"
                >
                  <option value="">All Classes</option>
                  {classesData?.classes?.map((c: any) => (
                    <option key={c._id} value={c._id}>
                      {c.name} - {c.section}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Invoices Found:{' '}
              <strong>{invoicesData?.pagination?.total || 0}</strong>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Invoice No</th>
                    <th className="px-6 py-3.5">Student & Class</th>
                    <th className="px-6 py-3.5">Fee Title</th>
                    <th className="px-6 py-3.5">Due Date</th>
                    <th className="px-6 py-3.5">Total Amount</th>
                    <th className="px-6 py-3.5">Paid</th>
                    <th className="px-6 py-3.5">Balance</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingInvoices ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="py-16 text-center text-slate-400"
                      >
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
                        Loading invoices...
                      </td>
                    </tr>
                  ) : invoicesData?.invoices?.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="py-16 text-center text-slate-400"
                      >
                        No fee invoices found matching current criteria.
                      </td>
                    </tr>
                  ) : (
                    invoicesData?.invoices?.map((inv: any) => (
                      <tr
                        key={inv._id}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="px-6 py-4 font-mono font-bold text-slate-700">
                          {inv.invoiceNumber}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800">
                            {inv.studentName}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {inv.className} - {inv.section} • Roll:{' '}
                            {inv.rollNumber || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-700 font-medium">
                          <div>{inv.title}</div>
                          {inv.concessionAmount > 0 && (
                            <span className="text-[10px] text-emerald-600 font-semibold">
                              (Concession: ₹
                              {inv.concessionAmount.toLocaleString()})
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {inv.dueDate}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          ₹{inv.totalAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-emerald-600 font-bold">
                          ₹{inv.paidAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-rose-600 font-bold">
                          ₹{inv.balance.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <Badge status={inv.status} variant="fee" />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenView(inv)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                              title="View Fee details"
                              aria-label="View Fee details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {canEdit && (
                              <>
                                <button
                                  onClick={() => handleOpenEdit(inv)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                  title="Edit Fee"
                                  aria-label="Edit Fee"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleOpenDelete(inv)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Delete Fee"
                                  aria-label="Delete Fee"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {inv.payments?.length > 0 && canViewReceipt && (
                              <button
                                onClick={() =>
                                  setViewReceiptNum(
                                    inv.payments[inv.payments.length - 1]
                                      .receiptNumber
                                  )
                                }
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors flex items-center gap-1"
                                title="Print latest receipt"
                                aria-label="Print latest receipt"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                Receipt
                              </button>
                            )}
                            {inv.balance > 0 && canCollect && (
                              <button
                                onClick={() => handleOpenPay(inv)}
                                className="px-3 py-1 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-sm transition-all"
                              >
                                Collect
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {invoicesData?.pagination?.totalPages > 1 && (
              <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Page {invoicesData.pagination.page} of{' '}
                  {invoicesData.pagination.totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= invoicesData.pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {activeTab === 'heads_structures' && (
        <div className="space-y-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  Fee Heads (Standard Rates)
                </h3>
                <p className="text-xs text-slate-500">
                  Pre-configured fees with frequency, amount, and assigned class
                  scope.
                </p>
              </div>
              {canEdit && (
                <button
                  onClick={() => setIsCreateHeadOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Fee Head
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Fee Title</th>
                    <th className="px-5 py-3">Frequency</th>
                    <th className="px-5 py-3">Class Applicability</th>
                    <th className="px-5 py-3">Standard Amount</th>
                    <th className="px-5 py-3">Academic Session</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingHeads ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 text-center text-slate-400"
                      >
                        Loading fee heads...
                      </td>
                    </tr>
                  ) : feeHeadsData?.heads?.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 text-center text-slate-400"
                      >
                        No fee heads created yet. Click "New Fee Head" to create
                        one.
                      </td>
                    </tr>
                  ) : (
                    feeHeadsData?.heads?.map((h: any) => (
                      <tr key={h._id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3 font-semibold text-slate-800">
                          {h.title}
                        </td>
                        <td className="px-5 py-3 capitalize font-medium text-slate-600">
                          {h.frequency}
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {h.className}
                        </td>
                        <td className="px-5 py-3 font-bold text-slate-900">
                          ₹{h.amount.toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-slate-500">
                          {h.academicYearName}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {canEdit && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditHead(h)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                                title="Edit Fee Head"
                                aria-label="Edit Fee Head"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenDeleteHead(h)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Delete Fee Head"
                                aria-label="Delete Fee Head"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  Class Fee Structures (Bundles)
                </h3>
                <p className="text-xs text-slate-500">
                  Grouped fee heads mapped to grade sections for one-click
                  invoice generation.
                </p>
              </div>
              {canEdit && (
                <button
                  onClick={handleOpenCreateStructure}
                  className="px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Fee Structure
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Structure Name</th>
                    <th className="px-5 py-3">Assigned Class</th>
                    <th className="px-5 py-3">Fee Heads Count</th>
                    <th className="px-5 py-3">Total Annual Package</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingStructures ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 text-center text-slate-400"
                      >
                        Loading structures...
                      </td>
                    </tr>
                  ) : feeStructuresData?.structures?.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 text-center text-slate-400"
                      >
                        No class fee structures defined yet. Click "New Fee Structure" to configure one.
                      </td>
                    </tr>
                  ) : (
                    feeStructuresData?.structures?.map((s: any) => (
                      <tr key={s._id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3 font-semibold text-slate-800">
                          {s.name}
                        </td>
                        <td className="px-5 py-3 font-medium text-slate-700">
                          {s.className} - {s.section}
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {s.feeHeads?.length || 0} Heads
                        </td>
                        <td className="px-5 py-3 font-bold text-slate-900">
                          ₹{s.totalAmount.toLocaleString()}
                        </td>
                        <td className="px-5 py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          {canEdit && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditStructure(s)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                                title="Edit Fee Structure"
                                aria-label="Edit Fee Structure"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenDeleteStructure(s)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Delete Fee Structure"
                                aria-label="Delete Fee Structure"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'concessions' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  Student Fee Concessions & Waivers
                </h3>
                <p className="text-xs text-slate-500">
                  Audit-tracked merit discounts, sibling waivers, and financial
                  aid grants.
                </p>
              </div>
              {canEdit && (
                <button
                  onClick={() => setIsCreateConcessionOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Apply Concession
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Student Name</th>
                    <th className="px-5 py-3">Class</th>
                    <th className="px-5 py-3">Concession Type</th>
                    <th className="px-5 py-3">Discount</th>
                    <th className="px-5 py-3">Amount Saved</th>
                    <th className="px-5 py-3">Reason</th>
                    <th className="px-5 py-3">Approval Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingConcessions ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-8 text-center text-slate-400"
                      >
                        Loading concessions...
                      </td>
                    </tr>
                  ) : concessionsData?.concessions?.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-8 text-center text-slate-400"
                      >
                        No concession records found.
                      </td>
                    </tr>
                  ) : (
                    concessionsData?.concessions?.map((c: any) => (
                      <tr key={c._id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3 font-semibold text-slate-800">
                          {c.studentName}
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {c.className} - {c.section}
                        </td>
                        <td className="px-5 py-3 capitalize font-medium text-slate-700">
                          {c.type.replace('_', ' ')}
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {c.discountType === 'percentage'
                            ? `${c.discountValue}%`
                            : `₹${c.discountValue.toLocaleString()}`}
                        </td>
                        <td className="px-5 py-3 font-bold text-emerald-600">
                          ₹{c.amount.toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-slate-600 max-w-xs truncate">
                          {c.reason}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              c.approvalStatus === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : c.approvalStatus === 'rejected'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {c.approvalStatus}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          {c.approvalStatus === 'pending' && canEdit && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() =>
                                  updateConcessionStatusMutation.mutate({
                                    id: c._id,
                                    status: 'approved',
                                  })
                                }
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                title="Approve Concession"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() =>
                                  updateConcessionStatusMutation.mutate({
                                    id: c._id,
                                    status: 'rejected',
                                  })
                                }
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100"
                                title="Reject Concession"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'defaulters' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search defaulter name or admission no..."
                  value={defaulterSearch}
                  onChange={(e) => setDefaulterSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="w-44">
                <select
                  value={defaulterClass}
                  onChange={(e) => setDefaulterClass(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-none cursor-pointer"
                >
                  <option value="">All Classes</option>
                  {classesData?.classes?.map((c: any) => (
                    <option key={c._id} value={c._id}>
                      {c.name} - {c.section}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportDefaultersCsv}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-brand-600" />
                Export CSV
              </button>
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Defaulters List
              </button>
            </div>
          </div>
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            id="printable-defaulters"
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-rose-50/40">
              <div>
                <h3 className="font-bold text-rose-950 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Fee Defaulters & Overdue Ledger
                </h3>
                <p className="text-xs text-slate-500">
                  Total Pending Default: ₹
                  {(
                    defaultersData?.summary?.totalOutstanding || 0
                  ).toLocaleString()}{' '}
                  across {defaultersData?.summary?.totalDefaulters || 0}{' '}
                  students.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Student Name</th>
                    <th className="px-5 py-3">Class</th>
                    <th className="px-5 py-3">Parent Contact</th>
                    <th className="px-5 py-3">Invoice No</th>
                    <th className="px-5 py-3">Total Invoiced</th>
                    <th className="px-5 py-3">Paid</th>
                    <th className="px-5 py-3">Overdue Balance</th>
                    <th className="px-5 py-3">Due Date</th>
                    <th className="px-5 py-3">Overdue Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingDefaulters ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="py-8 text-center text-slate-400"
                      >
                        Loading defaulters list...
                      </td>
                    </tr>
                  ) : defaultersData?.defaulters?.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="py-8 text-center text-slate-400"
                      >
                        No fee defaulters found for the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    defaultersData?.defaulters?.map((d: any) => (
                      <tr key={d.invoiceId} className="hover:bg-rose-50/20">
                        <td className="px-5 py-3">
                          <div className="font-semibold text-slate-800">
                            {d.studentName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {d.admissionNumber}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-700">
                          {d.className} - {d.section}
                        </td>
                        <td className="px-5 py-3">
                          <div className="font-medium text-slate-800">
                            {d.parentName || 'N/A'}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {d.parentPhone || 'No Phone'}
                          </div>
                        </td>
                        <td className="px-5 py-3 font-mono text-slate-600">
                          {d.invoiceNumber}
                        </td>
                        <td className="px-5 py-3 font-semibold text-slate-800">
                          ₹{d.totalAmount.toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-emerald-600 font-semibold">
                          ₹{d.paidAmount.toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-rose-600 font-bold">
                          ₹{d.balance.toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {d.dueDate}
                        </td>
                        <td className="px-5 py-3">
                          {d.overdueDays > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              {d.overdueDays} days late
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              Due today
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'daily_book' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <input
                  type="date"
                  value={feeBookDate}
                  onChange={(e) => setFeeBookDate(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-none cursor-pointer"
                />
              </div>

              <div className="w-40">
                <select
                  value={feeBookMethod}
                  onChange={(e) => setFeeBookMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-none cursor-pointer"
                >
                  <option value="">All Payment Modes</option>
                  <option value="cash">Cash Counter</option>
                  <option value="online">Online / UPI</option>
                  <option value="cheque">Cheque</option>
                  <option value="dd">Demand Draft (DD)</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportFeeBookCsv}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-brand-600" />
                Export CSV
              </button>
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Daily Ledger
              </button>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-between text-indigo-950">
            <div>
              <span className="text-xs font-medium text-indigo-700 block">
                Total Collections on {feeBookDate}
              </span>
              <span className="text-xl font-extrabold text-indigo-950">
                ₹{(feeBookData?.summary?.totalCollected || 0).toLocaleString()}
              </span>
            </div>
            <span className="text-xs text-indigo-700 font-semibold">
              {feeBookData?.summary?.transactionCount || 0} Transactions
            </span>
          </div>
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            id="printable-feebook"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Receipt No</th>
                    <th className="px-5 py-3">Invoice No</th>
                    <th className="px-5 py-3">Student & Class</th>
                    <th className="px-5 py-3">Mode</th>
                    <th className="px-5 py-3">Ref / Cheque No</th>
                    <th className="px-5 py-3">Cashier</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingFeeBook ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-8 text-center text-slate-400"
                      >
                        Loading daily ledger...
                      </td>
                    </tr>
                  ) : feeBookData?.records?.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-8 text-center text-slate-400"
                      >
                        No collections recorded for the selected date.
                      </td>
                    </tr>
                  ) : (
                    feeBookData?.records?.map((r: any) => (
                      <tr
                        key={r.receiptNumber}
                        className="hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-3 font-mono font-bold text-slate-700">
                          {r.receiptNumber}
                        </td>
                        <td className="px-5 py-3 font-mono text-slate-600">
                          {r.invoiceNumber}
                        </td>
                        <td className="px-5 py-3">
                          <div className="font-semibold text-slate-800">
                            {r.studentName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {r.className} - {r.section}
                          </div>
                        </td>
                        <td className="px-5 py-3 capitalize font-medium text-slate-700">
                          {r.paymentMethod}
                        </td>
                        <td className="px-5 py-3 font-mono text-slate-600">
                          {r.transactionRef || 'N/A'}
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {r.recordedByName}
                        </td>
                        <td className="px-5 py-3 font-bold text-emerald-600">
                          ₹{r.amount.toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => setViewReceiptNum(r.receiptNumber)}
                            className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'finance_expenses' && (
        <div className="space-y-6">
          <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-medium">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Double-Counting Prevention Guard Active:</strong> Fee
                revenue is strictly derived from discrete payment receipt
                transactions within date range, avoiding invoice balance
                duplicate counts.
              </span>
            </div>
            {canManageFinance && (
              <button
                type="button"
                onClick={() => setIsRecordExpenseOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-all shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Record Expense
              </button>
            )}
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-600">
                  Filters:
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={financeStartDate}
                  onChange={(e) => setFinanceStartDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700"
                />
                <span className="text-xs text-slate-400">to</span>
                <input
                  type="date"
                  value={financeEndDate}
                  onChange={(e) => setFinanceEndDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700"
                />
              </div>

              <div className="w-44">
                <select
                  value={expenseCategoryFilter}
                  onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium"
                >
                  <option value="">All Categories</option>
                  <option value="salaries">Salaries & Wages</option>
                  <option value="utilities">Utilities & Electricity</option>
                  <option value="maintenance">Maintenance & Repairs</option>
                  <option value="supplies">Supplies & Stationery</option>
                  <option value="events">Events & Programs</option>
                  <option value="technology">Technology & IT</option>
                  <option value="transportation">Transportation</option>
                  <option value="laboratory">Laboratory & Library</option>
                  <option value="other">Other Expenses</option>
                </select>
              </div>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Window:{' '}
              <strong>
                {financeSummaryData?.summary?.startDate || 'All Time'}
              </strong>{' '}
              to{' '}
              <strong>{financeSummaryData?.summary?.endDate || 'Today'}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-medium text-slate-400 block mb-1">
                Fee Receipts Income
              </span>
              <span className="text-2xl font-bold text-emerald-600 block">
                ₹
                {(financeSummaryData?.summary?.totalIncome || 0).toLocaleString(
                  'en-IN'
                )}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {financeSummaryData?.summary?.receiptsCount || 0} discrete
                payment receipts
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-medium text-slate-400 block mb-1">
                Total Operating Expenses
              </span>
              <span className="text-2xl font-bold text-rose-600 block">
                ₹
                {(
                  financeSummaryData?.summary?.totalExpenses || 0
                ).toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {financeSummaryData?.summary?.expensesCount || 0} recorded
                disbursements
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-medium text-slate-400 block mb-1">
                Net Operating Balance
              </span>
              <span
                className={`text-2xl font-bold block ${
                  (financeSummaryData?.summary?.netBalance || 0) >= 0
                    ? 'text-indigo-600'
                    : 'text-rose-700'
                }`}
              >
                ₹
                {(financeSummaryData?.summary?.netBalance || 0).toLocaleString(
                  'en-IN'
                )}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {(financeSummaryData?.summary?.netBalance || 0) >= 0
                  ? 'Surplus Reserve'
                  : 'Operating Deficit'}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-medium text-slate-400 block mb-1">
                Access Authorization
              </span>
              <span className="text-sm font-bold text-slate-800 block capitalize">
                {user?.role === 'admin'
                  ? 'Administrative Full Control'
                  : 'Delegated Finance Officer'}
              </span>
              <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
                {canManageFinance
                  ? 'Full Ledger Management'
                  : 'Read-Only Ledger Access'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-800 text-sm">
                Disbursements by Category
              </h3>
              <div className="space-y-2.5">
                {financeSummaryData?.summary?.categoryBreakdown?.map(
                  (cat: any) => (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 capitalize">
                          {cat.category}
                        </span>
                        <span className="font-bold text-slate-800">
                          ₹{cat.amount?.toLocaleString('en-IN')} (
                          {cat.percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full"
                          style={{ width: `${cat.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                )}
                {(!financeSummaryData?.summary?.categoryBreakdown ||
                  financeSummaryData.summary.categoryBreakdown.length ===
                    0) && (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    No expense disbursements recorded.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-800 text-sm">
                Payment Method Flows
              </h3>
              <div className="space-y-2.5">
                {financeSummaryData?.summary?.methodBreakdown?.map((m: any) => (
                  <div
                    key={m.method}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <span className="font-semibold text-slate-700 uppercase">
                      {m.method?.replace('_', ' ')}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-emerald-700 font-bold">
                        +₹{m.incomeAmount?.toLocaleString('en-IN')}
                      </span>
                      <span className="text-rose-700 font-bold">
                        -₹{m.expenseAmount?.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-800">
                  Institutional Expense Ledger
                </h3>
                <p className="text-xs text-slate-500">
                  Itemized administrative expenditures, vendor bills, and
                  payroll
                </p>
              </div>
              <span className="text-xs text-slate-400">
                {expensesData?.pagination?.total || 0} Records
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Payment Date</th>
                    <th className="px-6 py-3.5">Category</th>
                    <th className="px-6 py-3.5">Expense Title & Description</th>
                    <th className="px-6 py-3.5">Payee / Vendor</th>
                    <th className="px-6 py-3.5">Mode</th>
                    <th className="px-6 py-3.5 text-right">Amount (INR)</th>
                    {canManageFinance && (
                      <th className="px-6 py-3.5 text-center">Action</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {expensesData?.expenses?.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-8 text-center text-slate-400"
                      >
                        No expense records found.
                      </td>
                    </tr>
                  ) : (
                    expensesData?.expenses?.map((exp: any) => (
                      <tr
                        key={exp._id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {new Date(exp.paymentDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize bg-slate-100 text-slate-700 border border-slate-200">
                            {exp.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-800 block">
                            {exp.title}
                          </span>
                          {exp.description && (
                            <span className="text-xs text-slate-500">
                              {exp.description}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-800">
                          {exp.payee}
                        </td>
                        <td className="px-6 py-4 uppercase text-xs font-medium text-slate-600">
                          {exp.paymentMethod?.replace('_', ' ')}
                        </td>
                        <td className="px-6 py-4 text-right font-black text-rose-600">
                          ₹{exp.amount?.toLocaleString('en-IN')}
                        </td>
                        {canManageFinance && (
                          <td className="px-6 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Delete expense "${exp.title}" of ₹${exp.amount}?`
                                  )
                                ) {
                                  deleteExpenseMutation.mutate(exp._id);
                                }
                              }}
                              className="text-xs text-rose-600 hover:text-rose-800 font-semibold hover:underline"
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={isRecordExpenseOpen}
        onClose={() => setIsRecordExpenseOpen(false)}
        title="Record School Expense"
        subtitle="Log vendor disbursement, supplies invoice, or utility bill"
        maxWidth="max-w-md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createExpenseMutation.mutate(expenseForm);
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Expense Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Science Laboratory Reagents & Glassware"
              value={expenseForm.title}
              onChange={(e) =>
                setExpenseForm({ ...expenseForm, title: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={expenseForm.category}
                onChange={(e) =>
                  setExpenseForm({
                    ...expenseForm,
                    category: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="salaries">Salaries & Wages</option>
                <option value="utilities">Utilities & Electricity</option>
                <option value="maintenance">Maintenance & Repairs</option>
                <option value="supplies">Supplies & Stationery</option>
                <option value="events">Events & Programs</option>
                <option value="technology">Technology & IT</option>
                <option value="transportation">Transportation</option>
                <option value="laboratory">Laboratory & Library</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Amount (INR)
              </label>
              <input
                type="number"
                min="1"
                required
                value={expenseForm.amount || ''}
                onChange={(e) =>
                  setExpenseForm({
                    ...expenseForm,
                    amount: Number(e.target.value),
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Payee / Vendor
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Modern Scientific Supplies Ltd"
                value={expenseForm.payee}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, payee: e.target.value })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Payment Method
              </label>
              <select
                value={expenseForm.paymentMethod}
                onChange={(e) =>
                  setExpenseForm({
                    ...expenseForm,
                    paymentMethod: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="upi">UPI / Online</option>
                <option value="cheque">Cheque</option>
                <option value="cash">Cash Voucher</option>
                <option value="card">Corporate Card</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Payment Date
              </label>
              <input
                type="date"
                required
                value={expenseForm.paymentDate}
                onChange={(e) =>
                  setExpenseForm({
                    ...expenseForm,
                    paymentDate: e.target.value,
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Bill / Invoice Attachment
              </label>
              <input
                type="text"
                placeholder="File name or receipt link"
                value={expenseForm.attachmentName}
                onChange={(e) =>
                  setExpenseForm({
                    ...expenseForm,
                    attachmentName: e.target.value,
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Approved under Department Budget 2025-26"
              value={expenseForm.description}
              onChange={(e) =>
                setExpenseForm({ ...expenseForm, description: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsRecordExpenseOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createExpenseMutation.isPending}
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-sm transition-all"
            >
              {createExpenseMutation.isPending
                ? 'Recording...'
                : 'Save Expense Record'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Collect Fee Payment"
        subtitle={`Invoice ${selectedInvoice?.invoiceNumber} • ${selectedInvoice?.studentName}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleConfirmPayment} className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-200 text-orange-950 flex items-center justify-between">
            <span>Outstanding Due:</span>
            <span className="font-bold text-base text-rose-700">
              ₹{selectedInvoice?.balance?.toLocaleString()}
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Amount to Collect (INR)
            </label>
            <input
              type="number"
              min="1"
              max={selectedInvoice?.balance}
              required
              value={paymentForm.amount}
              onChange={(e) =>
                setPaymentForm({
                  ...paymentForm,
                  amount: Number(e.target.value),
                })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Payment Method
            </label>
            <select
              value={paymentForm.paymentMethod}
              onChange={(e) =>
                setPaymentForm({
                  ...paymentForm,
                  paymentMethod: e.target.value,
                })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
            >
              <option value="cash">Cash Counter</option>
              <option value="online">Online / UPI</option>
              <option value="cheque">Cheque</option>
              <option value="dd">Demand Draft (DD)</option>
              <option value="card">Credit / Debit Card</option>
              <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Transaction Ref / Cheque No / DD No (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. UPI-99881122 or CHQ-00123"
              value={paymentForm.transactionRef}
              onChange={(e) =>
                setPaymentForm({
                  ...paymentForm,
                  transactionRef: e.target.value,
                })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Payment Remarks (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Received at administrative accounts counter"
              value={paymentForm.notes}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, notes: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsPayModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={payMutation.isPending}
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-sm transition-all flex items-center gap-1.5"
            >
              {payMutation.isPending
                ? 'Generating Receipt...'
                : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        isOpen={isCreateHeadOpen}
        onClose={() => setIsCreateHeadOpen(false)}
        title="Create Fee Head"
        subtitle="Define a standardized fee component and frequency"
        maxWidth="max-w-md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createHeadMutation.mutate({
              ...headForm,
              academicYearId:
                headForm.academicYearId || currentAcademicYear?._id,
            });
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Fee Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Science Olympiad & Lab Material Fee"
              value={headForm.title}
              onChange={(e) =>
                setHeadForm({ ...headForm, title: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Amount (INR)
            </label>
            <input
              type="number"
              min="1"
              required
              value={headForm.amount || ''}
              onChange={(e) =>
                setHeadForm({ ...headForm, amount: Number(e.target.value) })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Frequency
              </label>
              <select
                value={headForm.frequency}
                onChange={(e) =>
                  setHeadForm({ ...headForm, frequency: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none bg-white"
              >
                <option value="yearly">Yearly</option>
                <option value="quarterly">Quarterly</option>
                <option value="monthly">Monthly</option>
                <option value="one-time">One-Time</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Class Scope
              </label>
              <select
                value={headForm.classSectionId}
                onChange={(e) =>
                  setHeadForm({ ...headForm, classSectionId: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none bg-white"
              >
                <option value="">All Classes</option>
                {classesData?.classes?.map((c: any) => (
                  <option key={c._id} value={c._id}>
                    {c.name} - {c.section}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Covers practical laboratory consumable costs"
              value={headForm.description}
              onChange={(e) =>
                setHeadForm({ ...headForm, description: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreateHeadOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createHeadMutation.isPending}
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-sm transition-all"
            >
              {createHeadMutation.isPending ? 'Saving...' : 'Create Fee Head'}
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        isOpen={isCreateConcessionOpen}
        onClose={() => setIsCreateConcessionOpen(false)}
        title="Apply Fee Concession"
        subtitle="Grant merit scholarship or financial assistance"
        maxWidth="max-w-md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createConcessionMutation.mutate({
              ...concessionForm,
              academicYearId:
                concessionForm.academicYearId || currentAcademicYear?._id,
            });
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Select Student
            </label>
            <select
              required
              value={concessionForm.studentId}
              onChange={(e) =>
                setConcessionForm({
                  ...concessionForm,
                  studentId: e.target.value,
                })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none bg-white"
            >
              <option value="">Choose Student...</option>
              {invoicesData?.invoices?.map((inv: any) => (
                <option
                  key={inv.studentId?._id || inv.studentId}
                  value={inv.studentId?._id || inv.studentId}
                >
                  {inv.studentName} ({inv.className} - {inv.section})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Concession Type
              </label>
              <select
                value={concessionForm.type}
                onChange={(e) =>
                  setConcessionForm({ ...concessionForm, type: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none bg-white"
              >
                <option value="merit">Merit Scholarship</option>
                <option value="sibling">Sibling Discount</option>
                <option value="staff_child">Staff Child</option>
                <option value="financial_aid">Financial Aid</option>
                <option value="special_waiver">Special Waiver</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Discount Type
              </label>
              <select
                value={concessionForm.discountType}
                onChange={(e) =>
                  setConcessionForm({
                    ...concessionForm,
                    discountType: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none bg-white"
              >
                <option value="fixed">Fixed Amount (₹)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Discount Value{' '}
              {concessionForm.discountType === 'percentage' ? '(%)' : '(INR)'}
            </label>
            <input
              type="number"
              min="1"
              required
              value={concessionForm.discountValue || ''}
              onChange={(e) =>
                setConcessionForm({
                  ...concessionForm,
                  discountValue: Number(e.target.value),
                })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Justification & Reason
            </label>
            <textarea
              rows={2}
              required
              placeholder="e.g. 1st rank in regional science fair or sibling enrolled in Grade 8"
              value={concessionForm.reason}
              onChange={(e) =>
                setConcessionForm({ ...concessionForm, reason: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreateConcessionOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createConcessionMutation.isPending}
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-sm transition-all"
            >
              {createConcessionMutation.isPending
                ? 'Submitting...'
                : 'Submit Concession'}
            </button>
          </div>
        </form>
      </Modal>
      {renderReceiptModal()}
      {renderViewFeeModal()}
      {renderEditFeeModal()}
      {renderDeleteFeeModal()}
      {renderEditFeeHeadModal()}
      {renderDeleteFeeHeadModal()}
      {renderCreateFeeStructureModal()}
      {renderEditFeeStructureModal()}
      {renderDeleteFeeStructureModal()}
    </div>
  );

  function renderReceiptModal() {
    return (
      <Modal
        isOpen={!!viewReceiptNum}
        onClose={() => setViewReceiptNum(null)}
        title="Official Fee Payment Receipt"
        subtitle="EduHub SMS • Financial Accounts & Audit Department"
        maxWidth="max-w-xl"
      >
        {loadingReceipt ? (
          <div className="py-12 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
            Loading receipt details...
          </div>
        ) : receiptData?.receipt ? (
          <div className="space-y-6 text-xs" id="printable-receipt">
            <div className="border-b border-slate-200 pb-4 text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                {receiptData.receipt.school.productBranding || 'EduHub SMS'}
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                {receiptData.receipt.school.name}
              </h2>
              <p className="text-[11px] text-slate-500">
                {receiptData.receipt.school.address}
              </p>
              <p className="text-[11px] text-slate-500">
                Phone: {receiptData.receipt.school.phone} • Email:{' '}
                {receiptData.receipt.school.email}
              </p>
              <div className="mt-2 inline-block px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold uppercase text-[10px] border border-emerald-200">
                Official Payment Receipt
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[11px]">
                  Receipt Number
                </span>
                <span className="font-mono font-bold text-slate-800 text-sm">
                  {receiptData.receipt.receiptNumber}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">
                  Payment Date
                </span>
                <span className="font-semibold text-slate-800">
                  {new Date(
                    receiptData.receipt.paymentDate
                  ).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">
                  Student Name
                </span>
                <span className="font-bold text-slate-800 text-sm">
                  {receiptData.receipt.student.name}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">
                  Class & Admission No
                </span>
                <span className="font-semibold text-slate-800">
                  {receiptData.receipt.student.className} -{' '}
                  {receiptData.receipt.student.section} •{' '}
                  {receiptData.receipt.student.admissionNumber || 'N/A'}
                </span>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between font-semibold text-slate-800">
                <span>Fee Description:</span>
                <span>{receiptData.receipt.invoiceSummary.title}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Payment Mode:</span>
                <span className="capitalize">
                  {receiptData.receipt.paymentMethod}
                </span>
              </div>
              {receiptData.receipt.transactionRef && (
                <div className="flex items-center justify-between text-slate-600">
                  <span>Transaction ID / Ref:</span>
                  <span className="font-mono">
                    {receiptData.receipt.transactionRef}
                  </span>
                </div>
              )}
              {receiptData.receipt.invoiceSummary.concessionAmount > 0 && (
                <div className="flex items-center justify-between text-emerald-600 font-medium">
                  <span>Concession / Scholarship:</span>
                  <span>
                    -₹
                    {receiptData.receipt.invoiceSummary.concessionAmount.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm">
                <span className="font-bold text-slate-800">
                  Amount Received:
                </span>
                <span className="font-black text-emerald-600 text-base">
                  ₹{receiptData.receipt.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Remaining Account Balance:</span>
                <span className="font-semibold text-rose-600">
                  ₹
                  {receiptData.receipt.invoiceSummary.remainingBalance.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="pt-6 flex items-center justify-between text-[11px] text-slate-500">
              <div>
                <span>Authorized Cashier: </span>
                <strong className="text-slate-700">
                  {receiptData.receipt.recordedByName}
                </strong>
              </div>
              <div className="text-right">
                <div className="w-28 border-b border-slate-300 mb-1"></div>
                <span>School Seal & Stamp</span>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Printer className="w-4 h-4" />
                Print Official Receipt
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    );
  }

  function renderViewFeeModal() {
    if (!selectedViewInvoice) return null;
    const inv = selectedViewInvoice;
    return (
      <Modal
        isOpen={isViewInvoiceOpen}
        onClose={() => setIsViewInvoiceOpen(false)}
        title="Fee Invoice Details"
        subtitle={`Invoice #${inv.invoiceNumber} • ${inv.className || ''} ${inv.section ? `- ${inv.section}` : ''}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-6 text-xs sm:text-sm">
          {/* Header information */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">
                Student
              </span>
              <span className="font-bold text-slate-800">
                {inv.studentName}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">
                Adm No / Roll
              </span>
              <span className="font-semibold text-slate-700">
                {inv.admissionNumber || 'N/A'} •{' '}
                {inv.rollNumber ? `Roll ${inv.rollNumber}` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">
                Due Date
              </span>
              <span className="font-semibold text-slate-700">
                {inv.dueDate}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">
                Status
              </span>
              <div className="mt-0.5">
                <Badge status={inv.status} variant="fee" />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-slate-500">
              Fee Breakdown
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-4 py-2.5">Item Description</th>
                    <th className="px-4 py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inv.items && inv.items.length > 0 ? (
                    inv.items.map((it: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 font-medium text-slate-700">
                          {it.title}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-800">
                          ₹{Number(it.amount).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-4 py-2.5 font-medium text-slate-700">
                        {inv.title}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-slate-800">
                        ₹{inv.totalAmount?.toLocaleString()}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold">
                ₹{(inv.subtotal || inv.totalAmount)?.toLocaleString()}
              </span>
            </div>
            {inv.concessionAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>
                  Concession / Scholarship (
                  {inv.concessionReason || 'Approved'})
                </span>
                <span>-₹{inv.concessionAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-slate-800 pt-1 border-t border-slate-200 text-sm">
              <span>Total Payable</span>
              <span>₹{inv.totalAmount?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-emerald-600 font-bold">
              <span>Amount Paid</span>
              <span>₹{inv.paidAmount?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-rose-600 font-bold text-sm pt-1 border-t border-slate-200">
              <span>Remaining Balance</span>
              <span>₹{inv.balance?.toLocaleString()}</span>
            </div>
          </div>

          {/* Transaction History */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-slate-500">
              Payment History & Receipts
            </h4>
            {inv.payments && inv.payments.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="px-3.5 py-2">Receipt No</th>
                      <th className="px-3.5 py-2">Date</th>
                      <th className="px-3.5 py-2">Mode</th>
                      <th className="px-3.5 py-2 text-right">Amount</th>
                      <th className="px-3.5 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inv.payments.map((p: any) => (
                      <tr key={p._id || p.receiptNumber}>
                        <td className="px-3.5 py-2 font-mono font-bold text-slate-700">
                          {p.receiptNumber}
                        </td>
                        <td className="px-3.5 py-2 text-slate-500">
                          {new Date(p.paymentDate).toLocaleDateString()}
                        </td>
                        <td className="px-3.5 py-2 capitalize text-slate-700">
                          {p.paymentMethod}
                        </td>
                        <td className="px-3.5 py-2 text-right font-bold text-emerald-600">
                          ₹{p.amount?.toLocaleString()}
                        </td>
                        <td className="px-3.5 py-2 text-right">
                          <button
                            onClick={() => {
                              setIsViewInvoiceOpen(false);
                              setViewReceiptNum(p.receiptNumber);
                            }}
                            className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold"
                          >
                            View Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                No payments have been recorded for this invoice yet.
              </p>
            )}
          </div>

          {/* Modal actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div className="flex gap-2">
              {canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setIsViewInvoiceOpen(false);
                    handleOpenEdit(inv);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5 text-blue-600" />
                  Edit Fee
                </button>
              )}
              {canCollect && inv.balance > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsViewInvoiceOpen(false);
                    handleOpenPay(inv);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Collect Payment
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsViewInvoiceOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  function renderEditFeeModal() {
    if (!editInvoiceForm) return null;

    const currentSubtotal = (editInvoiceForm.items || []).reduce(
      (sum: number, it: any) => sum + (Number(it.amount) || 0),
      0
    );
    const currentTotal = Math.max(
      0,
      currentSubtotal - (editInvoiceForm.concessionAmount || 0)
    );
    const currentBalance = Math.max(
      0,
      currentTotal - (editInvoiceForm.paidAmount || 0)
    );

    let previewStatus = 'pending';
    if (currentBalance === 0) {
      previewStatus = 'paid';
    } else if (editInvoiceForm.paidAmount > 0) {
      previewStatus = 'partially paid';
    } else if (
      editInvoiceForm.dueDate &&
      new Date(editInvoiceForm.dueDate) < new Date()
    ) {
      previewStatus = 'overdue';
    }

    const handleAddItem = () => {
      setEditInvoiceForm({
        ...editInvoiceForm,
        items: [...editInvoiceForm.items, { title: '', amount: 0 }],
      });
    };

    const handleRemoveItem = (index: number) => {
      if (editInvoiceForm.items.length <= 1) return;
      const newItems = editInvoiceForm.items.filter(
        (_: any, idx: number) => idx !== index
      );
      setEditInvoiceForm({ ...editInvoiceForm, items: newItems });
    };

    const handleItemChange = (index: number, field: string, val: any) => {
      const newItems = [...editInvoiceForm.items];
      newItems[index] = { ...newItems[index], [field]: val };
      setEditInvoiceForm({ ...editInvoiceForm, items: newItems });
    };

    return (
      <Modal
        isOpen={isEditInvoiceOpen}
        onClose={() => setIsEditInvoiceOpen(false)}
        title={`Edit Fee Invoice • ${editInvoiceForm.invoiceNumber}`}
        subtitle="Modify line items, due date, and invoice parameters"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveEditInvoice} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Invoice Title
            </label>
            <input
              type="text"
              required
              value={editInvoiceForm.title}
              onChange={(e) =>
                setEditInvoiceForm({
                  ...editInvoiceForm,
                  title: e.target.value,
                })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Due Date (YYYY-MM-DD)
            </label>
            <input
              type="date"
              required
              value={editInvoiceForm.dueDate}
              onChange={(e) =>
                setEditInvoiceForm({
                  ...editInvoiceForm,
                  dueDate: e.target.value,
                })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {/* Line Items Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700">
                Line Items & Amounts
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-2.5 py-1 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 font-semibold text-xs flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add Item
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {editInvoiceForm.items.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Fee Item Name (e.g. Tuition Fee)"
                    value={item.title}
                    onChange={(e) =>
                      handleItemChange(idx, 'title', e.target.value)
                    }
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-brand-500"
                  />
                  <div className="w-28 relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      required
                      min={1}
                      value={item.amount || ''}
                      onChange={(e) =>
                        handleItemChange(idx, 'amount', Number(e.target.value))
                      }
                      className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:border-brand-500 text-right"
                    />
                  </div>
                  {editInvoiceForm.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Calculation Summary */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold">
                ₹{currentSubtotal.toLocaleString()}
              </span>
            </div>
            {editInvoiceForm.concessionAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Concession Applied:</span>
                <span>
                  -₹{editInvoiceForm.concessionAmount.toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex justify-between font-bold text-slate-800 pt-1 border-t border-slate-200">
              <span>Total Payable:</span>
              <span>₹{currentTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-emerald-600">
              <span>Paid Amount:</span>
              <span>
                ₹{(editInvoiceForm.paidAmount || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-rose-600 font-bold">
              <span>Balance:</span>
              <span>₹{currentBalance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-200">
              <span className="text-slate-500">Calculated Status:</span>
              <Badge status={previewStatus} variant="fee" />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Reason / Notes for Modification
            </label>
            <input
              type="text"
              placeholder="e.g. Corrected tuition rate after mid-term curriculum update"
              value={editInvoiceForm.notes || ''}
              onChange={(e) =>
                setEditInvoiceForm({
                  ...editInvoiceForm,
                  notes: e.target.value,
                })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsEditInvoiceOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateInvoiceMutation.isPending}
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-sm transition-all flex items-center gap-1.5"
            >
              {updateInvoiceMutation.isPending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              {updateInvoiceMutation.isPending
                ? 'Saving Changes...'
                : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    );
  }

  function renderDeleteFeeModal() {
    if (!selectedDeleteInvoice) return null;
    const inv = selectedDeleteInvoice;
    const hasPayments =
      (inv.paidAmount && inv.paidAmount > 0) ||
      (inv.payments && inv.payments.length > 0);

    return (
      <Modal
        isOpen={isDeleteInvoiceOpen}
        onClose={() => setIsDeleteInvoiceOpen(false)}
        title={
          hasPayments
            ? 'Cancel & Archive Fee Invoice'
            : 'Delete Unpaid Fee Invoice'
        }
        subtitle={`Invoice #${inv.invoiceNumber} • ${inv.studentName}`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Student:</span>
              <span className="font-bold text-slate-800">
                {inv.studentName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Fee Title:</span>
              <span className="font-semibold text-slate-700">{inv.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Billed:</span>
              <span className="font-semibold text-slate-800">
                ₹{inv.totalAmount?.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Paid Amount:</span>
              <span className="font-bold text-emerald-600">
                ₹{inv.paidAmount?.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Remaining Balance:</span>
              <span className="font-bold text-rose-600">
                ₹{inv.balance?.toLocaleString()}
              </span>
            </div>
          </div>

          {hasPayments ? (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                Preserve Financial Audit Records
              </div>
              <p className="text-[11px] leading-relaxed">
                This invoice has recorded payments totaling{' '}
                <strong>₹{inv.paidAmount?.toLocaleString()}</strong>. Under
                accounting and statutory compliance rules, completed
                transactions cannot be deleted. Confirming will mark this
                invoice as <strong>Cancelled & Archived</strong>, zeroing the
                remaining balance while keeping payment receipts intact.
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                Confirm Permanent Deletion
              </div>
              <p className="text-[11px] leading-relaxed">
                This invoice is completely unpaid and has no transaction
                records. It will be permanently removed from the student ledger.
              </p>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsDeleteInvoiceOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleteInvoiceMutation.isPending}
              onClick={handleConfirmDeleteInvoice}
              className={`px-5 py-2 rounded-xl text-white font-semibold shadow-sm transition-all flex items-center gap-1.5 ${
                hasPayments
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {deleteInvoiceMutation.isPending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              {deleteInvoiceMutation.isPending
                ? 'Processing...'
                : hasPayments
                  ? 'Cancel & Archive Invoice'
                  : 'Delete Permanently'}
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  function renderEditFeeHeadModal() {
    return (
      <Modal
        isOpen={isEditHeadOpen}
        onClose={() => setIsEditHeadOpen(false)}
        title="Edit Fee Head"
        subtitle="Update fee rate, frequency, or class applicability"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveEditHead} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Fee Head Title
            </label>
            <input
              type="text"
              required
              value={editHeadForm.title}
              onChange={(e) =>
                setEditHeadForm({ ...editHeadForm, title: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Standard Amount (₹)
            </label>
            <input
              type="number"
              min="0"
              required
              value={editHeadForm.amount || ''}
              onChange={(e) =>
                setEditHeadForm({
                  ...editHeadForm,
                  amount: Number(e.target.value),
                })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Frequency
              </label>
              <select
                value={editHeadForm.frequency}
                onChange={(e) =>
                  setEditHeadForm({
                    ...editHeadForm,
                    frequency: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none bg-white"
              >
                <option value="yearly">Yearly</option>
                <option value="quarterly">Quarterly</option>
                <option value="monthly">Monthly</option>
                <option value="one-time">One-Time</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Class Scope
              </label>
              <select
                value={editHeadForm.classSectionId}
                onChange={(e) =>
                  setEditHeadForm({
                    ...editHeadForm,
                    classSectionId: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none bg-white"
              >
                <option value="">All Classes</option>
                {classesData?.classes?.map((c: any) => (
                  <option key={c._id} value={c._id}>
                    {c.name} - {c.section}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={editHeadForm.description}
              onChange={(e) =>
                setEditHeadForm({
                  ...editHeadForm,
                  description: e.target.value,
                })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsEditHeadOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateHeadMutation.isPending}
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-sm transition-all"
            >
              {updateHeadMutation.isPending ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    );
  }

  function renderDeleteFeeHeadModal() {
    if (!selectedDeleteHead) return null;
    return (
      <Modal
        isOpen={isDeleteHeadOpen}
        onClose={() => setIsDeleteHeadOpen(false)}
        title="Delete Fee Head"
        subtitle={`Remove standard rate • ${selectedDeleteHead.title}`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Fee Head:</span>
              <span className="font-bold text-slate-800">
                {selectedDeleteHead.title}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Standard Amount:</span>
              <span className="font-bold text-slate-900">
                ₹{selectedDeleteHead.amount?.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Frequency:</span>
              <span className="capitalize font-medium text-slate-700">
                {selectedDeleteHead.frequency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Applicability:</span>
              <span className="font-medium text-slate-700">
                {selectedDeleteHead.className || 'All Classes'}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-rose-900">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              Confirm Fee Head Deletion
            </div>
            <p className="text-[11px] leading-relaxed">
              Are you sure you want to delete this fee head? It will be removed from any fee structures that bundle it, and totals will be automatically recalculated.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsDeleteHeadOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleteHeadMutation.isPending}
              onClick={handleConfirmDeleteHead}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-sm transition-all flex items-center gap-1.5"
            >
              {deleteHeadMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : null}
              {deleteHeadMutation.isPending ? 'Deleting...' : 'Delete Fee Head'}
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  function renderCreateFeeStructureModal() {
    const availableHeads = feeHeadsData?.heads || [];
    const selectedHeads = availableHeads.filter((h: any) =>
      structureForm.feeHeadIds.includes(h._id)
    );
    const calculatedTotal = selectedHeads.reduce(
      (sum: number, h: any) => sum + (h.amount || 0),
      0
    );

    const toggleHead = (headId: string) => {
      setStructureForm((prev) => ({
        ...prev,
        feeHeadIds: prev.feeHeadIds.includes(headId)
          ? prev.feeHeadIds.filter((id) => id !== headId)
          : [...prev.feeHeadIds, headId],
      }));
    };

    return (
      <Modal
        isOpen={isCreateStructureOpen}
        onClose={() => setIsCreateStructureOpen(false)}
        title="Create Class Fee Structure"
        subtitle="Bundle fee heads and map to a specific class section"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveCreateStructure} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Select Class / Section <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={structureForm.classSectionId}
              onChange={(e) => {
                const selectedCls = classesData?.classes?.find(
                  (c: any) => c._id === e.target.value
                );
                setStructureForm((prev) => ({
                  ...prev,
                  classSectionId: e.target.value,
                  name:
                    prev.name ||
                    (selectedCls
                      ? `${selectedCls.name}-${selectedCls.section} Annual Fee Structure`
                      : ''),
                }));
              }}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none bg-white font-medium"
            >
              <option value="">Select Target Class & Section...</option>
              {classesData?.classes?.map((c: any) => (
                <option key={c._id} value={c._id}>
                  {c.name} - Section {c.section} ({c.roomNumber || 'Regular'})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Every class section (Class 1-A to Class 10-B) has its own assigned fee structure.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Structure Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Class 10-A Standard Annual Fee"
              value={structureForm.name}
              onChange={(e) =>
                setStructureForm({ ...structureForm, name: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none font-semibold text-slate-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Academic Session
            </label>
            <select
              value={structureForm.academicYearId || currentAcademicYear?._id}
              onChange={(e) =>
                setStructureForm({
                  ...structureForm,
                  academicYearId: e.target.value,
                })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none bg-white"
            >
              {academicYearsData?.academicYears?.map((ay: any) => (
                <option key={ay._id} value={ay._id}>
                  {ay.name} {ay.isCurrent ? '(Active Session)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-700">
                Select Applicable Fee Heads <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-500">
                {structureForm.feeHeadIds.length} of {availableHeads.length} selected
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50 p-1">
              {availableHeads.length === 0 ? (
                <p className="p-3 text-center text-slate-400">
                  No fee heads available. Please create fee heads first.
                </p>
              ) : (
                availableHeads.map((h: any) => {
                  const isChecked = structureForm.feeHeadIds.includes(h._id);
                  return (
                    <label
                      key={h._id}
                      className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-brand-50/60 text-brand-900'
                          : 'hover:bg-white text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleHead(h._id)}
                          className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                        />
                        <div>
                          <span className="font-semibold block">{h.title}</span>
                          <span className="text-[10px] text-slate-500 capitalize">
                            {h.frequency} • {h.className || 'All Classes'}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900">
                        ₹{h.amount?.toLocaleString()}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-between text-brand-950">
            <div>
              <span className="text-[11px] font-semibold text-brand-700 uppercase tracking-wider block">
                Total Annual Package
              </span>
              <span className="text-xl font-black text-brand-900">
                ₹{calculatedTotal.toLocaleString()}
              </span>
            </div>
            <span className="text-xs text-brand-700 font-medium">
              {structureForm.feeHeadIds.length} bundle items
            </span>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreateStructureOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createStructureMutation.isPending}
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-sm transition-all flex items-center gap-1.5"
            >
              {createStructureMutation.isPending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              {createStructureMutation.isPending
                ? 'Creating...'
                : 'Create Fee Structure'}
            </button>
          </div>
        </form>
      </Modal>
    );
  }

  function renderEditFeeStructureModal() {
    const availableHeads = feeHeadsData?.heads || [];
    const selectedHeads = availableHeads.filter((h: any) =>
      editStructureForm.feeHeadIds.includes(h._id)
    );
    const calculatedTotal = selectedHeads.reduce(
      (sum: number, h: any) => sum + (h.amount || 0),
      0
    );

    const toggleHead = (headId: string) => {
      setEditStructureForm((prev) => ({
        ...prev,
        feeHeadIds: prev.feeHeadIds.includes(headId)
          ? prev.feeHeadIds.filter((id) => id !== headId)
          : [...prev.feeHeadIds, headId],
      }));
    };

    return (
      <Modal
        isOpen={isEditStructureOpen}
        onClose={() => setIsEditStructureOpen(false)}
        title="Edit Class Fee Structure"
        subtitle="Modify structure name, class section, or bundled fee heads"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveEditStructure} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Select Class / Section <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={editStructureForm.classSectionId}
              onChange={(e) =>
                setEditStructureForm({
                  ...editStructureForm,
                  classSectionId: e.target.value,
                })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none bg-white font-medium"
            >
              {classesData?.classes?.map((c: any) => (
                <option key={c._id} value={c._id}>
                  {c.name} - Section {c.section}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Structure Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={editStructureForm.name}
              onChange={(e) =>
                setEditStructureForm({
                  ...editStructureForm,
                  name: e.target.value,
                })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none font-semibold text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Academic Session
              </label>
              <select
                value={editStructureForm.academicYearId}
                onChange={(e) =>
                  setEditStructureForm({
                    ...editStructureForm,
                    academicYearId: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none bg-white"
              >
                {academicYearsData?.academicYears?.map((ay: any) => (
                  <option key={ay._id} value={ay._id}>
                    {ay.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Status
              </label>
              <select
                value={editStructureForm.isActive ? 'active' : 'inactive'}
                onChange={(e) =>
                  setEditStructureForm({
                    ...editStructureForm,
                    isActive: e.target.value === 'active',
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none bg-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-700">
                Bundled Fee Heads <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-500">
                {editStructureForm.feeHeadIds.length} of {availableHeads.length} selected
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50 p-1">
              {availableHeads.map((h: any) => {
                const isChecked = editStructureForm.feeHeadIds.includes(h._id);
                return (
                  <label
                    key={h._id}
                    className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                      isChecked
                        ? 'bg-brand-50/60 text-brand-900'
                        : 'hover:bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleHead(h._id)}
                        className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                      />
                      <div>
                        <span className="font-semibold block">{h.title}</span>
                        <span className="text-[10px] text-slate-500 capitalize">
                          {h.frequency} • {h.className || 'All Classes'}
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900">
                      ₹{h.amount?.toLocaleString()}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-between text-brand-950">
            <div>
              <span className="text-[11px] font-semibold text-brand-700 uppercase tracking-wider block">
                Total Annual Package
              </span>
              <span className="text-xl font-black text-brand-900">
                ₹{calculatedTotal.toLocaleString()}
              </span>
            </div>
            <span className="text-xs text-brand-700 font-medium">
              {editStructureForm.feeHeadIds.length} bundle items
            </span>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsEditStructureOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateStructureMutation.isPending}
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-sm transition-all flex items-center gap-1.5"
            >
              {updateStructureMutation.isPending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              {updateStructureMutation.isPending
                ? 'Saving...'
                : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    );
  }

  function renderDeleteFeeStructureModal() {
    if (!selectedDeleteStructure) return null;
    return (
      <Modal
        isOpen={isDeleteStructureOpen}
        onClose={() => setIsDeleteStructureOpen(false)}
        title="Delete Fee Structure"
        subtitle={`Remove package • ${selectedDeleteStructure.name}`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Structure Name:</span>
              <span className="font-bold text-slate-800">
                {selectedDeleteStructure.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Assigned Class:</span>
              <span className="font-semibold text-slate-800">
                {selectedDeleteStructure.className} - {selectedDeleteStructure.section}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Annual Amount:</span>
              <span className="font-bold text-slate-900">
                ₹{selectedDeleteStructure.totalAmount?.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Fee Heads Count:</span>
              <span className="font-medium text-slate-700">
                {selectedDeleteStructure.feeHeads?.length || 0} Heads
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-rose-900">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              Confirm Fee Structure Deletion
            </div>
            <p className="text-[11px] leading-relaxed">
              Are you sure you want to delete this fee structure? Existing student invoices already generated will remain intact, but future bulk invoicing for this class will require configuring a structure again.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsDeleteStructureOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleteStructureMutation.isPending}
              onClick={handleConfirmDeleteStructure}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-sm transition-all flex items-center gap-1.5"
            >
              {deleteStructureMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : null}
              {deleteStructureMutation.isPending
                ? 'Deleting...'
                : 'Delete Fee Structure'}
            </button>
          </div>
        </div>
      </Modal>
    );
  }
};
