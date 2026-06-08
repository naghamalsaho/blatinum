import {
  validateRequiredText,
  validateSelect,
  validatePositiveNumber,
} from "@/shared/utils/validation";

export const validateUnitForm = (form) => {
  const errors = {};

  errors.building_id = validateSelect(form.building_id, "البناء");
  errors.unit_number = validateRequiredText(form.unit_number, "رقم الوحدة", 1, 50);
  errors.floor = validatePositiveNumber(form.floor, "الطابق", {
    min: 0,
    allowZero: true,
    max: 500,
  });
  errors.area = validatePositiveNumber(form.area, "المساحة", {
    min: 1,
    allowZero: false,
    max: 1000000,
  });
  errors.type = validateSelect(form.type, "النوع");
  errors.price = validatePositiveNumber(form.price, "السعر", {
    min: 0,
    allowZero: true,
    max: 100000000000,
  });
  errors.status = validateSelect(form.status, "الحالة");

  return Object.fromEntries(Object.entries(errors).filter(([, value]) => value));
};