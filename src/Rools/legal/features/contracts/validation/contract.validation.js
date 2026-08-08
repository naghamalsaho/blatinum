import {
  validatePositiveNumber,
  validateFile,
} from "@/shared/utils/validation"; // عدّل مسار ملف الفاليديشن العام لديك

export const validateContractForm = (data) => {
  const errors = {};

  const orderIdError = validatePositiveNumber(data.order_id, "رقم الطلب", {
    allowZero: false,
  });
  if (orderIdError) errors.order_id = orderIdError;

  const totalPriceError = validatePositiveNumber(
    data.total_price,
    "السعر الإجمالي",
    { allowZero: false }
  );
  if (totalPriceError) errors.total_price = totalPriceError;

  const downPaymentError = validatePositiveNumber(
    data.down_payment_amount,
    "مبلغ الدفعة الأولى",
    { allowZero: true }
  );
  if (downPaymentError) errors.down_payment_amount = downPaymentError;

  const installmentsError = validatePositiveNumber(
    data.installments_count,
    "عدد الأقساط",
    { allowZero: true }
  );
  if (installmentsError) errors.installments_count = installmentsError;

  // التحقق من المرفقات الممررة
  if (Array.isArray(data.attachments)) {
    data.attachments.forEach((file) => {
      const fileError = validateFile(file, "المرفق", { maxSizeMB: 10 });
      if (fileError && !errors.attachments) {
        errors.attachments = fileError;
      }
    });
  }

  return errors;
};