import {
  validatePositiveNumber,
  validateSelect,
  validateText,
} from "@/shared/utils/validation";

// معرف العقد
export const validateContractId = (value) => {
  return validatePositiveNumber(value, "معرف العقد", { min: 1, allowZero: false });
};

// سبب الاستثناء
export const validateExceptionReason = (value) => {
  return validateText(value, "سبب الاستثناء", { required: true, minLength: 5 });
};

// حالة الاستثناء
export const validateExceptionStatus = (value) => {
  return validateSelect(value, "حالة الاستثناء");
};

/**
 * فحص كامل بيانات نموذج إنشاء/تعديل استثناء عقد
 */
export const validateContractExceptionForm = (values) => {
  const errors = {};

  const contractIdErr = validateContractId(values.contract_id);
  if (contractIdErr) errors.contract_id = contractIdErr;

  if (values.exception_reason !== undefined) {
    const reasonErr = validateExceptionReason(values.exception_reason);
    if (reasonErr) errors.exception_reason = reasonErr;
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
};