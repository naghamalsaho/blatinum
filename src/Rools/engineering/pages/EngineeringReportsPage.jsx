import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  CheckCheck, 
  Calendar, 
  Building2, 
  User, 
  Layers,
  Printer
} from "lucide-react";

import PageHeader from "@/shared/components/PageHeader";
import StatCard from "@/shared/components/StatCard";
import Modal from "@/shared/components/Modal";

import { fetchReports } from "../features/reports/model/reports.thunks";

import "../styles/ReportsList.css";

const STATUS_CONFIG = {
  on_track: { label: "على المسار", class: "status-on-track", icon: CheckCircle2 },
  delayed: { label: "متأخر", class: "status-delayed", icon: AlertTriangle },
  completed: { label: "مكتمل", class: "status-completed", icon: CheckCheck },
};

const PHASE_LABELS = {
  finishing: "الإكساء والتشطيبات",
  electrical: "الأعمال الكهربائية",
  plumbing: "أعمال السباكة",
  structure: "الهيكل الإنشائي",
};

export default function EngineeringReportsPage() {
  const dispatch = useDispatch();

  const { items: reports = [], meta, loading, error } = useSelector(
    (state) => state.reports || {}
  );

  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    dispatch(fetchReports(1));
  }, [dispatch]);

  const handlePageChange = (page) => {
    if (page) {
      dispatch(fetchReports(page));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "غير محدد";
    return new Date(dateString).toLocaleDateString("ar-SY", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // دالة تصدير شاملة لكل البيانات والمعلومات الآتية من API التقرير
  const handleExportReport = (report) => {
    const {
      id,
      uuid,
      report_details,
      content,
      relationships,
      attachments = [],
      timestamps
    } = report;

    const project = relationships?.project || {};
    const engineerAccount = relationships?.engineer?.account || {};
    const engineerInfo = relationships?.engineer?.additional_info || {};

    const phaseLabel = PHASE_LABELS[report_details?.phase] || report_details?.phase || "غير محدد";
    const statusLabel = STATUS_CONFIG[report_details?.status]?.label || report_details?.status || "غير محدد";
    const reportDate = formatDate(report_details?.report_date);

    // بناء شبكة الصور والمرفقات
    const attachmentsHtml = attachments.length > 0 
      ? `
        <div class="section-box">
          <div class="section-title">المرفقات والصور الميدانية (${attachments.length})</div>
          <div class="attachments-grid">
            ${attachments.map((att, idx) => `
              <div class="attachment-card">
                <img src="${att.url}" alt="${att.original_name || 'صورة مرفقة'}" />
                <div class="att-info">
                  <span class="att-name">${att.original_name || `مرفق ${idx + 1}`}</span>
                  <span class="att-ext">${att.extension?.toUpperCase() || "JPG"}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `
      : '';

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تقرير موقع تفصيلي - ${project.name || 'مشروع'}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
          
          @page {
            size: A4;
            margin: 12mm;
          }

          * { box-sizing: border-box; }
          body {
            font-family: 'Tajawal', sans-serif;
            margin: 0;
            padding: 20px;
            color: #1e293b;
            background: #fff;
          }
          .report-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid #0f172a;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .brand-title {
            font-size: 22px;
            font-weight: 800;
            color: #0f172a;
          }
          .brand-subtitle {
            font-size: 11px;
            color: #64748b;
            margin-top: 2px;
          }
          .report-meta-head {
            text-align: left;
          }
          .report-meta-head h2 {
            margin: 0;
            font-size: 17px;
            color: #2563eb;
          }
          .report-meta-head p {
            margin: 3px 0 0;
            font-size: 11px;
            color: #64748b;
            direction: ltr;
          }
          
          .section-box {
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          .section-title {
            font-size: 13px;
            font-weight: 700;
            color: #0f172a;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 6px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .info-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            background: #f8fafc;
            padding: 14px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }
          .info-item {
            display: flex;
            flex-direction: column;
          }
          .info-label {
            font-size: 11px;
            color: #64748b;
            margin-bottom: 2px;
          }
          .info-value {
            font-size: 13px;
            color: #0f172a;
            font-weight: 700;
          }

          .progress-box {
            background: #fff;
            border: 1px solid #e2e8f0;
            padding: 14px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .progress-labels {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            font-weight: 700;
            margin-bottom: 6px;
          }
          .progress-bar {
            height: 10px;
            background: #e2e8f0;
            border-radius: 5px;
            overflow: hidden;
          }
          .progress-fill {
            height: 100%;
            background: #2563eb;
          }

          .description-text {
            font-size: 12.5px;
            line-height: 1.8;
            color: #334155;
            background: #fafafa;
            padding: 12px 16px;
            border-radius: 6px;
            border-right: 4px solid #2563eb;
            white-space: pre-wrap;
          }

          .attachments-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
          }
          .attachment-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
            background: #f8fafc;
            page-break-inside: avoid;
          }
          .attachment-card img {
            width: 100%;
            height: 180px;
            object-fit: cover;
            display: block;
          }
          .att-info {
            padding: 8px 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            background: #fff;
            border-top: 1px solid #e2e8f0;
          }
          .att-name {
            color: #334155;
            font-weight: 600;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 80%;
          }
          .att-ext {
            color: #2563eb;
            font-weight: 700;
          }

          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
            page-break-inside: avoid;
          }
          .sig-block {
            text-align: center;
            width: 200px;
          }
          .sig-title {
            font-size: 12px;
            font-weight: 700;
            color: #475569;
          }
          .sig-line {
            margin-top: 45px;
            border-bottom: 1px dashed #cbd5e1;
          }
        </style>
      </head>
      <body>
        <div class="report-header">
          <div>
            <div class="brand-title">شركة بلاتينيوم للمقاولات</div>
            <div class="brand-subtitle">PLATINUM CONTRACTING CO. - FIELD REPORT</div>
          </div>
          <div class="report-meta-head">
            <h2>تقرير موقع هندسي</h2>
            <p>ID: #${id} | UUID: ${uuid ? uuid.substring(0, 8) : 'N/A'}</p>
          </div>
        </div>

        <!-- تفاصيل المشروع -->
        <div class="section-box">
          <div class="section-title">بيانات المشروع</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">اسم المشروع</span>
              <span class="info-value">${project.name || "غير محدد"}</span>
            </div>
            <div class="info-item">
              <span class="info-label">حالة المشروع</span>
              <span class="info-value">${project.status || "غير محدد"}</span>
            </div>
            <div class="info-item">
              <span class="info-label">تاريخ التقرير</span>
              <span class="info-value">${reportDate}</span>
            </div>
            <div class="info-item">
              <span class="info-label">تاريخ البداية</span>
              <span class="info-value">${project.start_date || "-"}</span>
            </div>
            <div class="info-item">
              <span class="info-label">التاريخ المتوقع للانتهاء</span>
              <span class="info-value">${project.end_date || "-"}</span>
            </div>
            <div class="info-item">
              <span class="info-label">الموقع الجغرافي</span>
              <span class="info-value">${project.coordinates ? `${project.coordinates.latitude}, ${project.coordinates.longitude}` : "غير محدد"}</span>
            </div>
          </div>
        </div>

        <!-- تفاصيل المهندس -->
        <div class="section-box">
          <div class="section-title">بيانات المهندس المشرف</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">اسم المهندس</span>
              <span class="info-value">${engineerAccount.full_name || "غير محدد"}</span>
            </div>
            <div class="info-item">
              <span class="info-label">التخصص</span>
              <span class="info-value">${engineerInfo.specialization || "غير محدد"}</span>
            </div>
            <div class="info-item">
              <span class="info-label">سنوات الخبرة</span>
              <span class="info-value">${engineerInfo.experience_years ? `${engineerInfo.experience_years} سنوات` : "-"}</span>
            </div>
            <div class="info-item">
              <span class="info-label">البريد الإلكتروني</span>
              <span class="info-value">${engineerAccount.email || "-"}</span>
            </div>
            <div class="info-item">
              <span class="info-label">رقم الهاتف</span>
              <span class="info-value">${engineerAccount.phone || "-"}</span>
            </div>
            <div class="info-item">
              <span class="info-label">العنوان</span>
              <span class="info-value">${engineerAccount.address || "-"}</span>
            </div>
          </div>
        </div>

        <!-- نسب الإنجاز والمرحلة -->
        <div class="section-box">
          <div class="section-title">حالة ومراحل العمل</div>
          <div class="info-grid" style="margin-bottom: 12px;">
            <div class="info-item">
              <span class="info-label">المرحلة الحالية</span>
              <span class="info-value">${phaseLabel}</span>
            </div>
            <div class="info-item">
              <span class="info-label">حالة التقرير</span>
              <span class="info-value">${statusLabel}</span>
            </div>
            <div class="info-item">
              <span class="info-label">التقدم اليومي</span>
              <span class="info-value">+${report_details?.daily_progress || 0}%</span>
            </div>
          </div>

          <div class="progress-box">
            <div class="progress-labels">
              <span>نسبة الإنجاز الكلي للمشروع</span>
              <span>${report_details?.completion_percentage || 0}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${report_details?.completion_percentage || 0}%"></div>
            </div>
          </div>
        </div>

        <!-- الملاحظات والوصف -->
        <div class="section-box">
          <div class="section-title">ملاحظات وتفاصيل العمل اليومي</div>
          <div class="description-text">
            ${content?.description && content.description !== ".." ? content.description : "لا توجد ملاحظات تفصيلية إضافية مسجلة لهذا التقرير."}
          </div>
        </div>

        <!-- المرفقات إن وجدت -->
        ${attachmentsHtml}

        <!-- التواريخ والنظام -->
        <div class="section-box">
          <div class="info-grid" style="grid-template-columns: repeat(2, 1fr); background: #fff;">
            <div class="info-item">
              <span class="info-label">تاريخ إنشاء التقرير</span>
              <span class="info-value">${timestamps?.created_at || "-"}</span>
            </div>
            <div class="info-item">
              <span class="info-label">تاريخ آخر تحديث</span>
              <span class="info-value">${timestamps?.updated_at || "-"}</span>
            </div>
          </div>
        </div>

        <!-- التواقيع -->
        <div class="signatures">
          <div class="sig-block">
            <div class="sig-title">توقيع المهندس المشرف</div>
            <div class="sig-line"></div>
          </div>
          <div class="sig-block">
            <div class="sig-title">اعتماد مدير المشاريع</div>
            <div class="sig-line"></div>
          </div>
        </div>
      </body>
      </html>
    `;

    // إنشاء Iframe مخفي
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    // الانتظار حتى اكتمال تحميل جميع الصور المرفقة داخل الـ iframe ثم فتح الطباعة تلقائياً
    const images = doc.querySelectorAll("img");
    let loadedCount = 0;

    const triggerPrint = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    };

    if (images.length === 0) {
      setTimeout(triggerPrint, 300);
    } else {
      images.forEach((img) => {
        if (img.complete) {
          loadedCount++;
          if (loadedCount === images.length) triggerPrint();
        } else {
          img.onload = img.onerror = () => {
            loadedCount++;
            if (loadedCount === images.length) triggerPrint();
          };
        }
      });
    }
  };

  const totalReports = meta?.total || reports.length;
  const onTrackCount = reports.filter(r => r.report_details?.status === "on_track").length;
  const delayedCount = reports.filter(r => r.report_details?.status === "delayed").length;

  return (
    <div className="engineering-page" dir="rtl">
      <PageHeader
        kicker="القسم الهندسي"
        title="تقارير الموقع والإنجاز"
        subtitle="متابعة التقدّم اليومي ومراحل العمل في المشاريع"
      />

      <section className="legal-stats-grid">
        <StatCard title="إجمالي التقارير" value={totalReports} note="كل التقارير المسجلة" icon={FileText} />
        <StatCard title="على المسار" value={onTrackCount} note="تقارير ضمن الجدول" icon={CheckCircle2} />
        <StatCard title="متأخرة" value={delayedCount} note="تحتاج إلى متابعة" icon={AlertTriangle} />
      </section>

      {loading ? (
        <div className="project-empty-state">جاري تحميل تقارير الموقع...</div>
      ) : error ? (
        <div className="project-empty-state error-state">{error}</div>
      ) : reports.length === 0 ? (
        <div className="project-empty-state">لا توجد تقارير مسجلة حالياً.</div>
      ) : (
        <div className="reports-grid">
          {reports.map((report) => {
            const { report_details, relationships, attachments, timestamps, id } = report;
            const statusInfo = STATUS_CONFIG[report_details?.status] || {
              label: report_details?.status || "غير محدد",
              class: "status-default",
              icon: Layers,
            };
            const StatusIcon = statusInfo.icon;

            return (
              <div key={id} className="report-card">
                <div className="card-header">
                  <div className="project-title-group">
                    <div className="project-icon">
                      <Building2 size={22} />
                    </div>
                    <div>
                      <h3>{relationships?.project?.name || "مشروع غير محدد"}</h3>
                      <span className="report-date">
                        <Calendar size={13} /> {formatDate(report_details?.report_date)}
                      </span>
                    </div>
                  </div>
                  <span className={`status-badge ${statusInfo.class}`}>
                    <StatusIcon size={14} />
                    <span>{statusInfo.label}</span>
                  </span>
                </div>

                <div className="card-meta">
                  <div className="meta-pill">
                    <strong>المرحلة:</strong> {PHASE_LABELS[report_details?.phase] || report_details?.phase || "غير محدد"}
                  </div>
                  {relationships?.engineer && (
                    <div className="engineer-pill">
                      <span className="eng-avatar">
                        {relationships.engineer.account?.full_name?.charAt(0) || <User size={12} />}
                      </span>
                      <span>
                        {relationships.engineer.account?.full_name} ({relationships.engineer.additional_info?.specialization || "مهندس"})
                      </span>
                    </div>
                  )}
                </div>

                <div className="progress-section">
                  <div className="progress-item">
                    <div className="progress-label">
                      <span>نسبة الإنجاز الكلي</span>
                      <strong>{report_details?.completion_percentage || 0}%</strong>
                    </div>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill primary" style={{ width: `${report_details?.completion_percentage || 0}%` }}></div>
                    </div>
                  </div>

                  <div className="progress-item">
                    <div className="progress-label">
                      <span>التقدم اليومي</span>
                      <strong>+{report_details?.daily_progress || 0}%</strong>
                    </div>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill success" style={{ width: `${Math.min(report_details?.daily_progress || 0, 100)}%` }}></div>
                    </div>
                  </div>
                </div>

                {report.content?.description && report.content.description !== ".." && (
                  <div className="card-description">
                    <p>{report.content.description}</p>
                  </div>
                )}

                {attachments && attachments.length > 0 && (
                  <div className="attachments-section">
                    <span className="section-subtitle">المرفقات والصور ({attachments.length}):</span>
                    <div className="attachments-grid">
                      {attachments.map((att) => (
                        <div key={att.id} className="attachment-thumb" onClick={() => setSelectedImage(att.url)}>
                          <img src={att.url} alt={att.original_name || "مرفق"} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="card-footer">
                  <span className="timestamp-text">تم التسجيل: {timestamps?.created_at || "-"}</span>
                  
                  <div className="card-actions">
                    <button className="export-btn" onClick={() => handleExportReport(report)}>
                      <Printer size={15} />
                      <span>تصدير PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="pagination-wrapper">
          {meta.links?.map((link, idx) => (
            <button
              key={idx}
              disabled={!link.url}
              className={`page-btn ${link.active ? "active" : ""}`}
              onClick={() => handlePageChange(link.page)}
              dangerouslySetInnerHTML={{ __html: link.label }}
            />
          ))}
        </div>
      )}

      {/* Modal Lightbox */}
      {selectedImage && (
        <Modal open={Boolean(selectedImage)} onClose={() => setSelectedImage(null)} title="معاينة المرفق" size="lg">
          <div className="image-modal-body">
            <img src={selectedImage} alt="مرفق التقرير" className="modal-preview-img" />
          </div>
        </Modal>
      )}
    </div>
  );
}