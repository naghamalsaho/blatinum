import {
  validateRequiredText,
  validateSelect,
} from "@/shared/utils/validation";

export const validateLocationForm = (form) => {
  const errors = {};

  errors.name = validateRequiredText(form.name, "اسم الموقع", 2, 100);
  errors.type = validateSelect(form.type, "النوع");
  errors.parent_id = validateSelect(form.parent_id, "المنطقة الأب");

  return Object.fromEntries(Object.entries(errors).filter(([, value]) => value));
};