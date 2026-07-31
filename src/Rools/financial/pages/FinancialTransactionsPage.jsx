import React, { useState } from 'react';
import {
  Plus,
  Search,
  ChevronDown,
  Eye,
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  DollarSign,
  RefreshCw,
  X
} from 'lucide-react';
import './financial-transfers.css';

const initialTransfers = [
  {
    id: 1,
    sender: 'شركة الأمل للمقاولات',
    receiver: 'المهندس أحمد علي',
    account_num: 'TR-98234-2026',
    amount: 3500,
    transfer_type: 'صادرة',
    transfer_method: 'تحويل بنكي',
    transfer_date: '2026-07-27',
    status: 'completed',
    notes: 'دفعة مستحقات المرحلة الأولى من المشروع'
  },
  {
    id: 2,
    sender: 'مؤسسة النور التجاري',
    receiver: 'حساب الشركة الرئيسي',
    account_num: 'TR-11029-2026',
    amount: 1200,
    transfer_type: 'واردة',
    transfer_method: 'ويسترن يونيون',
    transfer_date: '2026-07-26',
    status: 'pending',
    notes: 'تحويل دفعة أولى لشراء مواد بناء'
  },
  {
    id: 3,
    sender: 'حساب الشركة الرئيسي',
    receiver: 'شركة توريد مواد البناء',
    account_num: 'TR-55412-2026',
    amount: 850,
    transfer_type: 'صادرة',
    transfer_method: 'نقدي (كاش)',
    transfer_date: '2026-07-25',
    status: 'completed',
    notes: 'تسديد فاتورة توريد أسمنت'
  },
  {
    id: 4,
    sender: 'العميل خالد العبدالله',
    receiver: 'حساب الشركة الرئيسي',
    account_num: 'TR-88120-2026',
    amount: 2100,
    transfer_type: 'واردة',
    transfer_method: 'تحويل بنكي',
    transfer_date: '2026-07-24',
    status: 'cancelled',
    notes: 'تم إلغاء التحويل بطلب من العميل'
  }
];

export default function FinancialTransfers() {
  const [transfers, setTransfers] = useState(initialTransfers);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);

  const [formData, setFormData] = useState({
    sender: '',
    receiver: '',
    amount: '',
    transfer_type: 'صادرة',
    transfer_method: 'تحويل بنكي',
    transfer_date: new Date().toISOString().split('T')[0],
    status: 'pending',
    notes: ''
  });

  const filteredTransfers = transfers.filter((t) => {
    const matchesSearch =
      t.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.receiver.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.account_num.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || t.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const newEntry = {
    //   id: Date.now(),
    //   account_num: `TR-${Math.floor(10000 + Math.random() * 90000)}-2026`,
    //   ...formData,
      amount: parseFloat(formData.amount) || 0
    };
    setTransfers([newEntry, ...transfers]);
    setIsAddOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      sender: '',
      receiver: '',
      amount: '',
      transfer_type: 'صادرة',
      transfer_method: 'تحويل بنكي',
      transfer_date: new Date().toISOString().split('T')[0],
      status: 'pending',
      notes: ''
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('هل أنت تأكد من رغبتك في حذف هذا التحويل؟')) {
      setTransfers(transfers.filter((item) => item.id !== id));
    }
  };

  const openPreview = (item) => {
    setSelectedTransfer(item);
    setIsPreviewOpen(true);
  };

  const renderStatusChip = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="financial-type-chip status-completed">
            <CheckCircle2 size={12} /> مكتملة
          </span>
        );
      case 'pending':
        return (
          <span className="financial-type-chip status-pending">
            <Clock size={12} /> قيد الانتظار
          </span>
        );
      case 'cancelled':
        return (
          <span className="financial-type-chip status-cancelled">
            <XCircle size={12} /> ملغاة
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="financial-payments-page" dir="rtl">
      {/* الهيدر */}
      <div className="financial-page-header">
        <div>
          <h1 className="financial-page-title">التحويلات المالية</h1>
          <p className="financial-page-subtitle">
            إدارة ومتابعة كافة حركة التحويلات المالية الصادرة والواردة
          </p>
        </div>
        <button className="financial-primary-btn" onClick={() => setIsAddOpen(true)}>
          <Plus size={18} />
          إجراء تحويل جديد
        </button>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="financial-payments-stats-grid">
        <div>
          <div>
            <span>إجمالي التحويلات</span>
            <h2>{transfers.length}</h2>
          </div>
          <RefreshCw size={22} />
        </div>

        <div>
          <div>
            <span>مجموع المبالغ</span>
            <h2>${transfers.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</h2>
          </div>
          <DollarSign size={22} />
        </div>

        <div>
          <div>
            <span>التحويلات الناجحة</span>
            <h2>{transfers.filter((t) => t.status === 'completed').length}</h2>
          </div>
          <CheckCircle2 size={22} />
        </div>

        <div>
          <div>
            <span>قيد المعالجة</span>
            <h2>{transfers.filter((t) => t.status === 'pending').length}</h2>
          </div>
          <Clock size={22} />
        </div>
      </div>

      {/* اللوحة الرئيسية */}
      <div className="financial-panel">
        <div className="financial-panel-head">
          <div>
            <h2>سجل الحركة المالية</h2>
            <p>عرض تفصيلي لعمليات التحويل وتدفق الأموال</p>
          </div>
        </div>

        {/* شريط البحث والفلترة */}
        <div className="financial-payments-toolbar">
          <div className="financial-search-wrapper">
            <div className="financial-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="ابحث باسم المرسل، المستلم، أو رقم المرجع..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="financial-status-dropdown">
              <button
                className="financial-status-trigger"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <span>
                  {statusFilter === 'all' && 'جميع الحالات'}
                  {statusFilter === 'completed' && 'المكتملة'}
                  {statusFilter === 'pending' && 'قيد الانتظار'}
                  {statusFilter === 'cancelled' && 'الملغاة'}
                </span>
                <ChevronDown className={`status-arrow ${isFilterOpen ? 'open' : ''}`} size={16} />
              </button>

              {isFilterOpen && (
                <div className="financial-status-menu">
                  <button
                    className={`status-menu-item ${statusFilter === 'all' ? 'active' : ''}`}
                    onClick={() => { setStatusFilter('all'); setIsFilterOpen(false); }}
                  >
                    جميع الحالات
                  </button>
                  <button
                    className={`status-menu-item ${statusFilter === 'completed' ? 'active' : ''}`}
                    onClick={() => { setStatusFilter('completed'); setIsFilterOpen(false); }}
                  >
                    المكتملة
                  </button>
                  <button
                    className={`status-menu-item ${statusFilter === 'pending' ? 'active' : ''}`}
                    onClick={() => { setStatusFilter('pending'); setIsFilterOpen(false); }}
                  >
                    قيد الانتظار
                  </button>
                  <button
                    className={`status-menu-item ${statusFilter === 'cancelled' ? 'active' : ''}`}
                    onClick={() => { setStatusFilter('cancelled'); setIsFilterOpen(false); }}
                  >
                    الملغاة
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* جدول البيانات */}
        <div className="financial-payments-table-wrap">
          <table className="financial-payments-table">
            <thead>
              <tr>
                <th>الأطراف (المرسل / المستلم)</th>
                <th>طريقة / نوع التحويل</th>
                <th>رقم المرجع</th>
                <th>المبلغ</th>
                <th>تاريخ التحويل</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransfers.length > 0 ? (
                filteredTransfers.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="financial-payment-title-cell">
                        <div className="financial-payment-icon-box">
                          {item.transfer_type === 'صادرة' ? (
                            <ArrowUpRight size={18} className="icon-outbound" />
                          ) : (
                            <ArrowDownLeft size={18} className="icon-inbound" />
                          )}
                        </div>
                        <div className="financial-payment-info">
                          <span className="financial-payment-title">
                            {item.sender} ➔ {item.receiver}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="financial-type-chip">
                        {item.transfer_method} • ({item.transfer_type})
                      </span>
                    </td>

                    <td>
                      <span className="financial-account-num">{item.account_num}</span>
                    </td>

                    <td>
                      <span className="financial-metric">
                        ${item.amount.toLocaleString()}
                      </span>
                    </td>

                    <td>
                      <span className="financial-account-num">{item.transfer_date}</span>
                    </td>

                    <td>{renderStatusChip(item.status)}</td>

                    <td>
                      <div className="financial-row-actions">
                        <button
                          className="financial-icon-btn"
                          title="معاينة التفاصيل"
                          onClick={() => openPreview(item)}
                        >
                          <Eye size={15} />
                        </button>
                        <button className="financial-icon-btn edit" title="تعديل">
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="financial-icon-btn danger"
                          title="حذف"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="financial-no-data">
                    لا توجد تحويلات مالية مطابقة للبحث.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==========================================
          MODAL: إضافة تحويل جديد
         ========================================== */}
      {isAddOpen && (
        <div className="financial-modal-overlay">
          <div className="financial-panel financial-modal-container">
            <div className="financial-panel-head">
              <h2>إجراء تحويل مال جديد</h2>
              <button className="financial-modal-close" onClick={() => setIsAddOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="financial-modal-form">
              <div className="financial-modal-grid">
                <div className="custom-form-group">
                  <label>
                    المرسل <span className="required-dot">*</span>
                  </label>
                  <input
                    type="text"
                    name="sender"
                    placeholder="اسم الجهة أو الشخص المرسل"
                    required
                    value={formData.sender}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="custom-form-group">
                  <label>
                    المستلم <span className="required-dot">*</span>
                  </label>
                  <input
                    type="text"
                    name="receiver"
                    placeholder="اسم المستلم"
                    required
                    value={formData.receiver}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="financial-modal-grid">
                <div className="custom-form-group">
                  <label>
                    المبلغ ($) <span className="required-dot">*</span>
                  </label>
                  <input
                    type="number"
                    name="amount"
                    placeholder="0.00"
                    required
                    value={formData.amount}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="custom-form-group">
                  <label>تاريخ التحويل</label>
                  <input
                    type="date"
                    name="transfer_date"
                    value={formData.transfer_date}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="financial-modal-grid">
                <div className="custom-form-group">
                  <label>نوع التحويل</label>
                  <select name="transfer_type" value={formData.transfer_type} onChange={handleInputChange}>
                    <option value="صادرة">صادرة (خارج من الحساب)</option>
                    <option value="واردة">واردة (داخل للحساب)</option>
                  </select>
                </div>

                <div className="custom-form-group">
                  <label>طريقة التحويل</label>
                  <select name="transfer_method" value={formData.transfer_method} onChange={handleInputChange}>
                    <option value="تحويل بنكي">تحويل بنكي</option>
                    <option value="ويسترن يونيون">ويسترن يونيون</option>
                    <option value="نقدي (كاش)">نقدي (كاش)</option>
                    <option value="محفظة إلكترونية">محفظة إلكترونية</option>
                  </select>
                </div>
              </div>

              <div className="custom-form-group">
                <label>حالة التحويل</label>
                <select name="status" value={formData.status} onChange={handleInputChange}>
                  <option value="pending">قيد الانتظار</option>
                  <option value="completed">مكتملة</option>
                  <option value="cancelled">ملغاة</option>
                </select>
              </div>

              <div className="custom-form-group">
                <label>ملاحظات أو بيان التحويل</label>
                <textarea
                  name="notes"
                  placeholder="اكتب أية تفاصيل إضافية عن العملية..."
                  value={formData.notes}
                  onChange={handleInputChange}
                />
              </div>

              <div className="financial-modal-actions">
                <button type="submit" className="btn-save-primary">
                  <Send size={16} /> حفظ وإرسال
                </button>
                <button
                  type="button"
                  className="btn-cancel-secondary"
                  onClick={() => setIsAddOpen(false)}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: معاينة التفاصيل
         ========================================== */}
      {isPreviewOpen && selectedTransfer && (
        <div className="financial-modal-overlay">
          <div className="financial-panel financial-modal-container preview">
            <div className="financial-panel-head">
              <h2>تفاصيل التحويل المالي</h2>
              <button className="financial-modal-close" onClick={() => setIsPreviewOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="financial-preview-modal">
              <div className="financial-preview-card">
                <div className="financial-preview-row">
                  <span className="label">رقم مرجع العملية</span>
                  <span className="value">{selectedTransfer.account_num}</span>
                </div>

                <div className="financial-preview-row">
                  <span className="label">المرسل</span>
                  <span className="value">{selectedTransfer.sender}</span>
                </div>

                <div className="financial-preview-row">
                  <span className="label">المستلم</span>
                  <span className="value">{selectedTransfer.receiver}</span>
                </div>

                <div className="financial-preview-row">
                  <span className="label">المبلغ الإجمالي</span>
                  <span className="value highlight">${selectedTransfer.amount.toLocaleString()}</span>
                </div>

                <div className="financial-preview-row">
                  <span className="label">طريقة التحويل</span>
                  <span className="value">{selectedTransfer.transfer_method}</span>
                </div>

                <div className="financial-preview-row">
                  <span className="label">التاريخ</span>
                  <span className="value">{selectedTransfer.transfer_date}</span>
                </div>

                <div className="financial-preview-row">
                  <span className="label">الحالة الحالية</span>
                  <span className="value">{renderStatusChip(selectedTransfer.status)}</span>
                </div>
              </div>

              {selectedTransfer.notes && (
                <div className="financial-preview-details">
                  <h4 className="financial-preview-title">البيان / الملاحظات</h4>
                  <p className="financial-preview-desc">{selectedTransfer.notes}</p>
                </div>
              )}

              <div className="financial-modal-actions justify-end">
                <button
                  className="btn-cancel-secondary"
                  onClick={() => setIsPreviewOpen(false)}
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}