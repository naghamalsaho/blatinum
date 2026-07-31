// استدعاء الدوال العامة من ملف الفاليديشن العام الخاص بك
import {
  validatePositiveNumber,
  validateDate,
  validateSelect,
  validateFile,
} from "../../../../../shared/utils/validation"; // 👈 قم بتعديل مسار الملف حسب مكان وجوده لديك

// ============================================
// 1. التحقق من الحقول الفردية للدفعات
// ============================================

// معرف العميل
export const validateClientId = (value) => {
  return validatePositiveNumber(value, "معرف العميل", { min: 1, allowZero: false });
};

// معرف العقد
export const validateContractId = (value) => {
  return validatePositiveNumber(value, "معرف العقد", { min: 1, allowZero: false });
};

// قيمة المبلغ
export const validateAmount = (value) => {
  return validatePositiveNumber(value, "المبلغ", { min: 1, allowZero: false });
};

// تاريخ الدفع
export const validatePaymentDate = (value) => {
  return validateDate(value, "تاريخ الدفع");
};

// حالة الدفعة
export const validatePaymentStatus = (value) => {
  return validateSelect(value, "الحالة");
};

// طريقة الدفع (نقدي / كاش / تحويل...)
export const validatePaymentMethod = (value) => {
  return validateSelect(value, "طريقة الدفع");
};

// نوع الدفعة (دفعة أولى / قسط...)
export const validatePaymentType = (value) => {
  return validateSelect(value, "نوع الدفعة");
};

// قائمة المرفقات
export const validatePaymentAttachments = (files = []) => {
  if (!Array.isArray(files)) return "";
  
  for (let i = 0; i < files.length; i++) {
    const fileError = validateFile(files[i], `المرفق رقم ${i + 1}`, {
      required: false,
      maxSizeMB: 10,
    });
    if (fileError) return fileError;
  }
  
  return "";
};

// ============================================
// 2. التحقق الشامل للنموذج (Form Validation)
// ============================================

/**
 * فحص كامل بيانات نموذج إنشاء دفعة جديدة
 */
export const validateCreatePaymentForm = (values, files = []) => {
  const errors = {};

  const clientIdErr = validateClientId(values.client_id);
  if (clientIdErr) errors.client_id = clientIdErr;

  const contractIdErr = validateContractId(values.contract_id);
  if (contractIdErr) errors.contract_id = contractIdErr;

  const amountErr = validateAmount(values.amount);
  if (amountErr) errors.amount = amountErr;

  const dateErr = validatePaymentDate(values.payment_date);
  if (dateErr) errors.payment_date = dateErr;

  const statusErr = validatePaymentStatus(values.status);
  if (statusErr) errors.status = statusErr;

  const methodErr = validatePaymentMethod(values.payment_method);
  if (methodErr) errors.payment_method = methodErr;

  const typeErr = validatePaymentType(values.payment_type);
  if (typeErr) errors.payment_type = typeErr;

  const filesErr = validatePaymentAttachments(files);
  if (filesErr) errors.files = filesErr;

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
};

/**
 * فحص كامل بيانات نموذج تعديل دفعة حالية
 */
export const validateUpdatePaymentForm = (values, files = []) => {
  const errors = {};

  const dateErr = validatePaymentDate(values.payment_date);
  if (dateErr) errors.payment_date = dateErr;

  const statusErr = validatePaymentStatus(values.status);
  if (statusErr) errors.status = statusErr;

  const methodErr = validatePaymentMethod(values.payment_method);
  if (methodErr) errors.payment_method = methodErr;

  const typeErr = validatePaymentType(values.payment_type);
  if (typeErr) errors.payment_type = typeErr;

  const filesErr = validatePaymentAttachments(files);
  if (filesErr) errors.files = filesErr;

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
};