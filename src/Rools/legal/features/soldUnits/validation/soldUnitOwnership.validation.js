import {
  
  validatePositiveNumber,
  containsMaliciousContent,
} from "@/shared/utils/validation";

const ALLOWED_STATUSES = new Set(["active", "inactive"]);
const ALLOWED_ATTACHMENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/pdf",
]);

const MAX_ATTACHMENT_SIZE_MB = 10;
const MAX_ATTACHMENT_SIZE = MAX_ATTACHMENT_SIZE_MB * 1024 * 1024;

const isValidDateString = (value) => {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

export const validateSoldUnitOwnershipForm = (form) => {
  const errors = {};

  const clientId = String(form.client_id ?? "").trim();
  if (!clientId) {
    errors.client_id = "معرف العميل مطلوب";
  } else if (
    containsMaliciousContent(clientId) ||
    Number.isNaN(Number(clientId)) ||
    Number(clientId) <= 0
  ) {
    errors.client_id = "معرف العميل غير صالح";
  }

  errors.purchase_price = validatePositiveNumber(
    form.purchase_price,
    "سعر الشراء",
    {
      min: 1,
      allowZero: false,
      max: 999999999999,
    }
  );

  const statusValue = String(form.status ?? "").trim().toLowerCase();
  if (!statusValue) {
    errors.status = "الحالة مطلوبة";
  } else if (
    containsMaliciousContent(statusValue) ||
    !ALLOWED_STATUSES.has(statusValue)
  ) {
    errors.status = "الحالة غير صالحة";
  }

  const ownedAt = String(form.owned_at ?? "").trim();
  if (!ownedAt) {
    errors.owned_at = "تاريخ التملك مطلوب";
  } else if (!isValidDateString(ownedAt)) {
    errors.owned_at = "تاريخ التملك غير صالح";
  }

  const attachments = Array.isArray(form.attachments) ? form.attachments : [];
  if (attachments.length > 0) {
    for (const file of attachments) {
      if (!file) continue;

      if (!ALLOWED_ATTACHMENT_TYPES.has(file.type)) {
        errors.attachments = "المرفقات يجب أن تكون صورة أو PDF";
        break;
      }

      if (file.size > MAX_ATTACHMENT_SIZE) {
        errors.attachments = `حجم كل ملف يجب ألا يتجاوز ${MAX_ATTACHMENT_SIZE_MB}MB`;
        break;
      }
    }
  }

  return Object.fromEntries(
    Object.entries(errors).filter(([, value]) => value)
  );
};