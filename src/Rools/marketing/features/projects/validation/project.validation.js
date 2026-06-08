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

export const validateProjectForm = (form, mode = "create") => {
  const errors = {};

  errors.name = validateRequiredText(form.name, "اسم المشروع", 3, 100);
  errors.latitude = validateLatitude(form.latitude);
  errors.longitude = validateLongitude(form.longitude);
  errors.radius_meters = validatePositiveNumber(form.radius_meters, "نصف القطر", {
    min: 1,
    allowZero: false,
  });
  errors.status = validateSelect(form.status, "الحالة");

  if (mode === "create") {
    errors.description = validateOptionalText(form.description, "الوصف", 1000);
    errors.location_id = validateSelect(form.location_id, "الموقع");
    errors.start_date = validateDate(form.start_date, "تاريخ البداية");
    errors.attachment = validateFile(form.attachment, "صورة المشروع", {
      required: false,
      maxSizeMB: 10,
    });
  }

  return Object.fromEntries(Object.entries(errors).filter(([, value]) => value));
};