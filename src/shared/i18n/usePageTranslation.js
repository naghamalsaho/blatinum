import { useEffect } from "react";
import { getLanguage } from "@/shared/i18n";

// Covers legacy page copy while new screens use translation keys directly.
// Keeping this bridge in one place prevents mixed Arabic/English screens.
export const LEGACY_AR_TRANSLATIONS = {
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
  "access groups": "مجموعات الوصول", "account": "الحساب", "account roles:": "أدوار الحساب:", "account status": "حالة الحساب",
  "accounts returned as employees": "الحسابات المسجلة كموظفين", "active teams": "الفرق النشطة", "add role": "إضافة دور",
  "allowed actions": "الإجراءات المسموحة", "are you sure you want to delete": "هل أنت متأكد من رغبتك في حذف", "assign": "إسناد",
  "assign roles": "إسناد الأدوار", "assignable accounts": "الحسابات المتاحة للإسناد", "assigning...": "جارٍ الإسناد...",
  "create an employee account from the employee > account api.": "أنشئ حساب موظف من واجهة الموظف والحساب.",
  "create department": "إنشاء قسم", "create item": "إنشاء عنصر", "create warehouse": "إنشاء مستودع", "current": "الحالي",
  "customer service": "خدمة العملاء", "delete department": "حذف القسم", "delete item": "حذف العنصر",
  "delete this department?": "هل تريد حذف هذا القسم؟", "delete this item?": "هل تريد حذف هذا العنصر؟",
  "delete this warehouse?": "هل تريد حذف هذا المستودع؟", "delete warehouse": "حذف المستودع", "deleting...": "جارٍ الحذف...",
  "department #": "القسم رقم #", "department employees": "موظفو القسم", "department list": "قائمة الأقسام",
  "department:": "القسم:", "departments": "الأقسام", "edit": "تعديل", "edit warehouse": "تعديل المستودع",
  "employee #": "الموظف رقم #", "employee accounts": "حسابات الموظفين", "employee details": "تفاصيل الموظف",
  "employee identifiers": "معرّفات الموظف", "expires:": "تاريخ الانتهاء:", "expiry date": "تاريخ الانتهاء",
  "from date": "من تاريخ", "loading employee details...": "جارٍ تحميل تفاصيل الموظف...", "log #": "السجل رقم #",
  "manage the items stored in this warehouse.": "إدارة العناصر المخزنة في هذا المستودع.", "no department": "دون قسم",
  "no departments found": "لم يتم العثور على أقسام", "no email": "لا يوجد بريد إلكتروني", "no permissions found": "لم يتم العثور على صلاحيات",
  "no phone": "لا يوجد هاتف", "no roles found": "لم يتم العثور على أدوار", "no staff": "لا يوجد موظفون",
  "no warehouses found": "لم يتم العثور على مستودعات", "permissions in editor": "الصلاحيات في المحرر",
  "purchase date": "تاريخ الشراء", "purchased:": "تاريخ الشراء:", "qty:": "الكمية:", "quantity": "الكمية",
  "received date": "تاريخ الاستلام", "received:": "تاريخ الاستلام:", "remove": "إزالة", "remove employee": "إزالة الموظف",
  "remove from department": "إزالة من القسم", "remove this employee from the department?": "هل تريد إزالة هذا الموظف من القسم؟",
  "removing...": "جارٍ الإزالة...", "role #": "الدور رقم #", "role name": "اسم الدور",
  "roles and permissions sections": "أقسام الأدوار والصلاحيات", "save": "حفظ", "save assignment": "حفظ الإسناد",
  "search departments...": "ابحث في الأقسام...", "search roles, permissions...": "ابحث في الأدوار والصلاحيات...",
  "select a role from the roles tab": "اختر دورًا من تبويب الأدوار", "select user": "اختر مستخدمًا", "selected": "محدد",
  "specialized roles": "الأدوار التخصصية", "staffed": "يضم موظفين", "to date": "إلى تاريخ",
  "unique access roles": "أدوار وصول فريدة", "unverified": "غير موثّق", "update assignment": "تحديث الإسناد",
  "update department": "تحديث القسم", "update warehouse": "تحديث المستودع", "user #": "المستخدم رقم #", "users": "المستخدمون",
  "verified employee accounts": "حسابات موظفين موثّقة", "view employee details": "عرض تفاصيل الموظف",
  "view employees": "عرض الموظفين", "view items": "عرض العناصر", "warehouse items": "عناصر المستودع",
  "warehouse:": "المستودع:", "warehouses": "المستودعات",
  "ai generated design": "تصميم مولّد بالذكاء الاصطناعي", "ai redesign result": "نتيجة إعادة التصميم بالذكاء الاصطناعي",
  "large ai generated design": "عرض مكبّر للتصميم المولّد بالذكاء الاصطناعي", "engineer id:": "معرّف المهندس:",
  "project id:": "معرّف المشروع:",
  "latitude": "خط العرض", "latitude:": "خط العرض:", "longitude": "خط الطول", "radius meters": "نصف القطر بالأمتار",
  "action": "الإجراء", "apply status": "تطبيق الحالة", "assigned to legal": "مُسند إلى القسم القانوني",
  "awaiting review": "بانتظار المراجعة", "closed": "مغلق", "final decisions": "القرارات النهائية",
  "in progress": "قيد المعالجة", "incoming orders": "الطلبات الواردة", "initially accepted": "مقبول مبدئيًا",
  "legal": "القسم القانوني", "legal incoming orders": "الطلبات القانونية الواردة",
  "loading incoming orders...": "جارٍ تحميل الطلبات الواردة...", "no incoming legal orders found.": "لم يتم العثور على طلبات قانونية واردة.",
  "no notes yet.": "لا توجد ملاحظات بعد.", "order id": "معرّف الطلب", "process order #": "معالجة الطلب رقم #",
  "review and process the incoming legal order.": "راجع الطلب القانوني الوارد وعالجه.",
  "search legal incoming orders...": "ابحث في الطلبات القانونية الواردة...",
  "send this order to finance & accounting.": "أرسل هذا الطلب إلى قسم المالية والمحاسبة.",
  "transfer to finance": "تحويل إلى المالية", "unit / solution": "الوحدة / الحل", "view / process": "عرض / معالجة",
  "write an internal legal note...": "اكتب ملاحظة قانونية داخلية...",
};

const AR = LEGACY_AR_TRANSLATIONS;

const PLACEHOLDERS = {
  "search warehouses...": "ابحث في المستودعات...", "search appointments...": "ابحث في المواعيد...",
  "type your reply...": "اكتب ردك...", "first name": "الاسم الأول", "last name": "اسم العائلة",
  "confirm password": "تأكيد كلمة المرور", "leave empty to keep current": "اتركها فارغة للاحتفاظ بالحالية",
  "search orders by client, unit, status, or date...": "ابحث بالعميل أو الوحدة أو الحالة أو التاريخ...",
  "write a clear note for this order...": "اكتب ملاحظة واضحة لهذا الطلب...", "optional transfer note...": "ملاحظة اختيارية للتحويل...",
};

const EN = Object.fromEntries(Object.entries(AR).map(([english, arabic]) => [arabic, english.replace(/\b\w/g, (letter) => letter.toUpperCase())]));
const EN_PLACEHOLDERS = Object.fromEntries(Object.entries(PLACEHOLDERS).map(([english, arabic]) => [arabic, english]));

const translateText = (value) => {
  const trimmed = value.trim();
  const isArabic = getLanguage() === "ar";
  const translated = isArabic ? AR[trimmed.toLowerCase()] : EN[trimmed];
  return translated ? value.replace(trimmed, translated) : value;
};

function translateTree(root) {
  if (!(root instanceof Element) && root !== document.body) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    if (!node.parentElement?.closest("script,style,[data-no-translate]")) {
      const translated = translateText(node.nodeValue);
      if (translated !== node.nodeValue) node.nodeValue = translated;
    }
  });

  root.querySelectorAll?.("input[placeholder], textarea[placeholder]").forEach((element) => {
    const current = element.placeholder;
    const isArabic = getLanguage() === "ar";
    const translated = isArabic
      ? PLACEHOLDERS[current.trim().toLowerCase()] || AR[current.trim().toLowerCase()]
      : EN_PLACEHOLDERS[current.trim()] || EN[current.trim()];
    if (translated) element.placeholder = translated;
  });
  root.querySelectorAll?.("[title]").forEach((element) => {
    const translated = translateText(element.title);
    if (translated !== element.title) element.title = translated;
  });
  root.querySelectorAll?.("[aria-label]").forEach((element) => {
    const current = element.getAttribute("aria-label") || "";
    const translated = translateText(current);
    if (translated !== current) element.setAttribute("aria-label", translated);
  });
  root.querySelectorAll?.("img[alt]").forEach((element) => {
    const translated = translateText(element.alt);
    if (translated !== element.alt) element.alt = translated;
  });
}

export function usePageTranslation() {
  useEffect(() => {
    translateTree(document.body);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "characterData") {
          const translated = translateText(mutation.target.nodeValue);
          if (translated !== mutation.target.nodeValue) mutation.target.nodeValue = translated;
        }
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            const translated = translateText(node.nodeValue);
            if (translated !== node.nodeValue) node.nodeValue = translated;
          } else if (node.nodeType === Node.ELEMENT_NODE) translateTree(node);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);
}
