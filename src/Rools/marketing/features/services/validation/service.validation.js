import { containsMaliciousContent } from "@/shared/utils/validation";

export const validateServiceCreate = (values = {}) => {
  const errors = {};

  const name = String(values.name || "").trim();
  const description = String(values.description || "").trim();
  const price = values.price;

  if (!name) {
    errors.name = "اسم الخدمة مطلوب";
  } else if (containsMaliciousContent(name)) {
    errors.name = "اسم الخدمة يحتوي على محتوى غير صالح";
  }

  if (!description) {
    errors.description = "الوصف مطلوب";
  } else if (containsMaliciousContent(description)) {
    errors.description = "الوصف يحتوي على محتوى غير صالح";
  }

  if (price === "" || price === null || price === undefined) {
    errors.price = "السعر مطلوب";
  } else if (Number.isNaN(Number(price))) {
    errors.price = "السعر يجب أن يكون رقماً";
  } else if (Number(price) < 0) {
    errors.price = "السعر غير صالح";
  }

  return errors;
};

export const validateServiceUpdate = (values = {}) => {
  const errors = {};

  const name = String(values.name || "").trim();
  const description = String(values.description || "").trim();
  const price = values.price;

  const hasAnyField =
    Boolean(name) ||
    Boolean(description) ||
    (price !== undefined && price !== null && String(price).trim() !== "");

  if (!hasAnyField) {
    errors.form = "عدلي الاسم أو الوصف أو السعر على الأقل";
  }

  if (name && containsMaliciousContent(name)) {
    errors.name = "اسم الخدمة يحتوي على محتوى غير صالح";
  }

  if (description && containsMaliciousContent(description)) {
    errors.description = "الوصف يحتوي على محتوى غير صالح";
  }

  if (price !== undefined && price !== null && String(price).trim() !== "") {
    if (Number.isNaN(Number(price))) {
      errors.price = "السعر يجب أن يكون رقماً";
    } else if (Number(price) < 0) {
      errors.price = "السعر غير صالح";
    }
  }

  return errors;
};

export const getFirstValidationMessage = (errors = {}) =>
  errors.name || errors.description || errors.price || errors.form || "";