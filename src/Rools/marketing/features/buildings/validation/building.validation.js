import {
  validateRequiredText,
  validateOptionalText,
  validateSelect,
  validateDate,
  validateLatitude,
  validateLongitude,
  validatePositiveNumber,
  validateFile,
} from "@/shared/utils/validation";

export const validateBuildingForm = (form, mode = "create") => {
  const errors = {};

  errors.project_id = validateSelect(form.project_id, "المشروع");
  errors.building_number = validateRequiredText(form.building_number, "رقم البناء", 1, 50);
  errors.floors_count = validatePositiveNumber(form.floors_count, "عدد الطوابق", {
    min: 1,
    allowZero: false,
    max: 500,
  });
  errors.status = validateSelect(form.status, "الحالة");
  errors.latitude = validateLatitude(form.latitude);
  errors.longitude = validateLongitude(form.longitude);
  errors.radius_meters = validatePositiveNumber(form.radius_meters, "نصف القطر", {
    min: 1,
    allowZero: false,
  });

  if (mode === "create") {
    errors.description = validateOptionalText(form.description, "الوصف", 1000);
    errors.start_date = validateDate(form.start_date, "تاريخ البداية");
    errors.attachment = validateFile(form.attachment, "صورة البناء", {
      required: false,
      maxSizeMB: 10,
    });
  }

  return Object.fromEntries(Object.entries(errors).filter(([, value]) => value));
};