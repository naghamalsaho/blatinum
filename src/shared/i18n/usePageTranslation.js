import { useEffect } from "react";
import { getLanguage } from "@/shared/i18n";

// Covers legacy page copy while new screens use translation keys directly.
// Keeping this bridge in one place prevents mixed Arabic/English screens.
const AR = {
  "total": "الإجمالي", "active": "نشط", "completed": "مكتمل", "cancelled": "ملغي",
  "pending": "قيد الانتظار", "empty": "فارغ", "items": "العناصر", "assigned": "مسند",
  "with items": "تحتوي عناصر", "stocked stores": "مستودعات تحتوي مخزون", "no items": "لا توجد عناصر",
  "new warehouse": "مستودع جديد", "warehouse list": "قائمة المستودعات", "loading warehouses...": "جارٍ تحميل المستودعات...",
  "name": "الاسم", "location": "الموقع", "address": "العنوان", "description": "الوصف", "actions": "الإجراءات",
  "new department": "قسم جديد", "employees": "الموظفون", "lead": "المسؤول", "loading departments...": "جارٍ تحميل الأقسام...",
  "assign employee": "إسناد موظف", "no employees assigned": "لا يوجد موظفون مسندون", "no employee selected": "لم يتم اختيار موظف",
  "select employee": "اختر موظفاً", "employee": "الموظف", "position": "المنصب", "select location": "اختر الموقع",
  "create employee": "إنشاء موظف", "update employee": "تعديل الموظف", "delete employee": "حذف الموظف",
  "first name": "الاسم الأول", "last name": "اسم العائلة", "email": "البريد الإلكتروني", "phone": "الهاتف",
  "gender": "الجنس", "male": "ذكر", "female": "أنثى", "password": "كلمة المرور", "confirm password": "تأكيد كلمة المرور",
  "not assigned": "غير مسند", "staff": "موظف", "cancel": "إلغاء", "delete": "حذف", "save changes": "حفظ التعديلات",
  "saving...": "جارٍ الحفظ...", "add item": "إضافة عنصر", "no items assigned": "لا توجد عناصر مسندة",
  "search": "بحث", "roles": "الأدوار", "role": "الدور", "permissions": "الصلاحيات", "permission": "الصلاحية",
  "created": "تاريخ الإنشاء", "created at": "تاريخ الإنشاء", "updated": "آخر تحديث", "updated at": "آخر تحديث",
  "role overview": "نظرة عامة على الأدوار", "quick access summary": "ملخص سريع", "manage permissions": "إدارة الصلاحيات",
  "no permissions yet.": "لا توجد صلاحيات بعد.", "module": "الوحدة", "assign role to user": "إسناد دور لمستخدم",
  "attach one or more roles to an account": "إسناد دور واحد أو أكثر إلى الحساب", "choose a user": "اختر مستخدماً",
  "available roles": "الأدوار المتاحة", "roles that can be assigned": "الأدوار المتاحة للإسناد",
  "read only": "للقراءة فقط",
  "new appointment": "موعد جديد", "appointment": "الموعد", "appointment status": "حالة الموعد", "order": "الطلب",
  "order status": "حالة الطلب", "slot": "الفترة", "slot time": "وقت الفترة", "slot status": "حالة الفترة",
  "created by": "أنشئ بواسطة", "loading appointments...": "جارٍ تحميل المواعيد...", "choose a client": "اختر عميلاً",
  "select the customer who requested the appointment.": "اختر العميل الذي طلب الموعد.", "choose an order": "اختر طلباً",
  "pick the order that this appointment belongs to.": "اختر الطلب المرتبط بهذا الموعد.", "choose an available slot": "اختر فترة متاحة",
  "select the time that should be reserved.": "اختر الوقت المطلوب حجزه.", "booked now": "محجوز الآن",
  "chat room": "غرفة المحادثة", "room id": "رقم الغرفة", "client": "العميل", "client id": "رقم العميل",
  "employee id": "رقم الموظف", "status": "الحالة", "latest message": "آخر رسالة", "loading messages...": "جارٍ تحميل الرسائل...",
  "loading unassigned chats...": "جارٍ تحميل المحادثات غير المسندة...", "loading active chats...": "جارٍ تحميل المحادثات النشطة...",
  "no unassigned chats right now.": "لا توجد محادثات غير مسندة حالياً.", "no active chats yet.": "لا توجد محادثات نشطة بعد.",
  "no messages yet.": "لا توجد رسائل بعد.", "open a room to see its details.": "افتح غرفة لعرض تفاصيلها.",
  "choose an active or unassigned chat to view messages.": "اختر محادثة نشطة أو غير مسندة لعرض الرسائل.",
  "complaint types": "أنواع الشكاوى", "loading complaints...": "جارٍ تحميل الشكاوى...", "loading types...": "جارٍ تحميل الأنواع...",
  "no complaint types yet.": "لا توجد أنواع شكاوى بعد.", "title": "العنوان", "type": "النوع", "unit": "الوحدة",
  "no orders found": "لا توجد طلبات", "loading order details...": "جارٍ تحميل تفاصيل الطلب...", "department": "القسم",
  "customer information": "معلومات العميل", "full name": "الاسم الكامل", "national id": "الرقم الوطني",
  "birth date": "تاريخ الميلاد", "job title": "المسمى الوظيفي", "social status": "الحالة الاجتماعية",
  "account type": "نوع الحساب", "verified at": "تاريخ التحقق", "verified": "موثّق", "unit information": "معلومات الوحدة",
  "unit number": "رقم الوحدة", "area": "المساحة", "rooms": "الغرف", "building id": "رقم البناء", "floor": "الطابق",
  "price": "السعر", "department information": "معلومات القسم", "department name": "اسم القسم", "department id": "رقم القسم",
  "notes": "الملاحظات", "attachments": "المرفقات", "no notes available.": "لا توجد ملاحظات.",
  "order / client": "الطلب / العميل", "item": "العنصر", "view": "عرض", "change status": "تغيير الحالة",
  "transfer order": "تحويل الطلب", "add note": "إضافة ملاحظة", "transfer destination": "جهة التحويل",
  "transfer status": "حالة التحويل", "internal note": "ملاحظة داخلية", "add a note for this order": "أضف ملاحظة لهذا الطلب",
  "new order status": "حالة الطلب الجديدة", "eligibility rules": "شروط الأهلية", "lottery workspace": "مساحة اليانصيب",
  "winner": "الفائز", "eligible entries": "المؤهلون", "lottery details": "تفاصيل اليانصيب", "unit id": "رقم الوحدة",
  "winner result": "نتيجة الفائز", "participants": "المشاركون", "and the winner is...": "والفائز هو...",
  "draw failed": "فشلت القرعة", "lottery": "اليانصيب", "rules": "الشروط", "loading lotteries...": "جارٍ تحميل اليانصيب...",
  "no lotteries found": "لا توجد جولات يانصيب", "loading roles...": "جارٍ تحميل الأدوار...", "loading permissions...": "جارٍ تحميل الصلاحيات...",
};

const PLACEHOLDERS = {
  "search warehouses...": "ابحث في المستودعات...", "search appointments...": "ابحث في المواعيد...",
  "type your reply...": "اكتب ردك...", "first name": "الاسم الأول", "last name": "اسم العائلة",
  "confirm password": "تأكيد كلمة المرور", "leave empty to keep current": "اتركها فارغة للاحتفاظ بالحالية",
  "search orders by client, unit, status, or date...": "ابحث بالعميل أو الوحدة أو الحالة أو التاريخ...",
  "write a clear note for this order...": "اكتب ملاحظة واضحة لهذا الطلب...", "optional transfer note...": "ملاحظة اختيارية للتحويل...",
};

const translateText = (value) => {
  const trimmed = value.trim();
  const translated = AR[trimmed.toLowerCase()];
  return translated ? value.replace(trimmed, translated) : value;
};

function translateTree(root) {
  if (!(root instanceof Element) && root !== document.body) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    if (!node.parentElement?.closest("script,style,[data-no-translate]")) node.nodeValue = translateText(node.nodeValue);
  });

  root.querySelectorAll?.("input[placeholder], textarea[placeholder]").forEach((element) => {
    const key = element.placeholder.trim().toLowerCase();
    if (PLACEHOLDERS[key]) element.placeholder = PLACEHOLDERS[key];
  });
  root.querySelectorAll?.("[title]").forEach((element) => {
    const key = element.title.trim().toLowerCase();
    if (AR[key]) element.title = AR[key];
  });
}

export function usePageTranslation() {
  useEffect(() => {
    if (getLanguage() !== "ar") return undefined;
    translateTree(document.body);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) node.nodeValue = translateText(node.nodeValue);
        else if (node.nodeType === Node.ELEMENT_NODE) translateTree(node);
      }));
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
}
