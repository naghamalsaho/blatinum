import {
  validateRequiredText,
  validateOptionalText,
  validatePositiveNumber,
  containsMaliciousContent,
} from "@/shared/utils/validation";

const ALLOWED_AD_STATUSES = new Set(["0", "1"]);
const ALLOWED_ATTACHMENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/pdf",
]);

export const validateAdvertisementForm = (form) => {
  const errors = {};

  errors.title = validateRequiredText(form.title, "عنوان الإعلان", 3, 120);
  errors.description = validateOptionalText(form.description, "الوصف", 1000);

  const statusValue = String(form.status ?? "").trim();
  if (!statusValue) {
    errors.status = "حالة الإعلان مطلوبة";
  } else if (containsMaliciousContent(statusValue) || !ALLOWED_AD_STATUSES.has(statusValue)) {
    errors.status = "حالة الإعلان غير صالحة";
  }

  errors.duration_days = validatePositiveNumber(
    form.duration_days,
    "مدة الإعلان",
    {
      min: 1,
      allowZero: false,
      max: 3650,
    }
  );

  if (form.attachmentFile) {
    const file = form.attachmentFile;

    if (!ALLOWED_ATTACHMENT_TYPES.has(file.type)) {
      errors.attachmentFile = "الملف يجب أن يكون صورة أو PDF";
    } else {
      const maxSizeMB = 10;
      const maxSize = maxSizeMB * 1024 * 1024;

      if (file.size > maxSize) {
        errors.attachmentFile = `الملف يجب ألا يتجاوز ${maxSizeMB}MB`;
      }
    }
  }

  return Object.fromEntries(
    Object.entries(errors).filter(([, value]) => value)
  );
};