import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  Wand2, 
  Sparkles, 
  Building2, 
  Home, 
  Palette, 
  Layers, 
  Send, 
  Download, 
  Maximize2, 
  AlertCircle,
  Image as ImageIcon,
  Ruler,
  Compass,
  Loader2,
 
  FileDown
} from "lucide-react";

import PageHeader from "@/shared/components/PageHeader";
import Modal from "@/shared/components/Modal";

import { generateDesignFromText } from "../features/aidesign/model/aiDesign.thunks";


import { fetchBuildings } from "../../../Rools/marketing/features/buildings/model/building.thunks";
import { fetchUnitsByBuilding } from "../../../Rools/marketing/features/units/model/unit.thunks";

import "../styles/AiDesignPage.css";

const STYLES_OPTIONS = [
  { id: "modern", label: "عصري (Modern)", icon: "✨" },
  { id: "classic", label: "كلاسيك (Classic)", icon: "🏛️" },
  { id: "minimalist", label: "بسيط (Minimalist)", icon: "🌿" },
  { id: "industrial", label: "صناعي (Industrial)", icon: "🏭" },
  { id: "luxury", label: "فاخر (Luxury)", icon: "💎" },
];

export default function AiDesignPage() {
  const dispatch = useDispatch();

  const { result, loading, error } = useSelector((state) => state.aiDesign || {});
  const { buildings = [], loading: buildingsLoading } = useSelector((state) => state.buildings || {});
  const { buildingUnits = [], buildingLoading: unitsLoading } = useSelector((state) => state.units || {});

  const [activeTab, setActiveTab] = useState("from-text");
  const [previewImage, setPreviewImage] = useState(null);

  const [formData, setFormData] = useState({
    building_id: "",
    apartment_number: "",
    style: "modern",
    prompt: "",
  });

  useEffect(() => {
    dispatch(fetchBuildings());
  }, [dispatch]);

  useEffect(() => {
    if (formData.building_id) {
      dispatch(fetchUnitsByBuilding(formData.building_id));
    }
  }, [dispatch, formData.building_id]);

  const handleBuildingChange = (e) => {
    const selectedBuildingId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      building_id: selectedBuildingId,
      apartment_number: "",
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitFromText = (e) => {
    e.preventDefault();
    if (!formData.prompt.trim() || !formData.building_id || !formData.apartment_number) return;

    const dataPayload = new FormData();
    dataPayload.append("building_id", formData.building_id);
    dataPayload.append("apartment_number", formData.apartment_number);
    dataPayload.append("style", formData.style);
    dataPayload.append("prompt", formData.prompt);

    dispatch(generateDesignFromText(dataPayload));
  };

 

  // تابع تصدير التقرير بتنسيق PDF رسمي مع صور الهيكل وترويسة الشركة
  const handleExportFullReport = () => {
    if (!result) return;

    const details = result.details || result.data?.details || {};
    const selectedBuilding = buildings.find((b) => String(b.id) === String(formData.building_id));
    const buildingName = selectedBuilding?.name || selectedBuilding?.building_name || `بناء ${formData.building_id}`;
    const mainImgUrl = result?.main_image_url || result?.generated_images?.[0] || result?.data?.main_image_url || "";
    const styleLabel = STYLES_OPTIONS.find((s) => s.id === formData.style)?.label || formData.style;
    const rooms = details.rooms || [];

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const reportHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8" />
        <title>تقرير التصميم المعماري - شركة بلاتينيوم</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;600;700;800&display=swap');
          body {
            font-family: 'Tajawal', sans-serif;
            margin: 0;
            padding: 25px;
            color: #1e293b;
            background: #fff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #078db8;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .company-brand h1 {
            margin: 0;
            font-size: 22px;
            color: #078db8;
            font-weight: 800;
          }
          .company-brand p {
            margin: 3px 0 0;
            font-size: 12px;
            color: #64748b;
          }
          .report-meta {
            text-align: left;
            font-size: 11px;
            color: #475569;
          }
          .section-title {
            font-size: 15px;
            font-weight: 700;
            color: #0f172a;
            border-right: 4px solid #078db8;
            padding-right: 8px;
            margin: 20px 0 10px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            background: #f8fafc;
            padding: 12px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            margin-bottom: 20px;
          }
          .info-item {
            font-size: 13px;
          }
          .info-item strong {
            color: #334155;
          }
          .main-image-container {
            text-align: center;
            margin: 20px 0;
            page-break-inside: avoid;
          }
          .main-image-container img {
            max-width: 100%;
            max-height: 420px;
            border-radius: 10px;
            border: 1px solid #cbd5e1;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          }
          .notes-box {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 8px;
            padding: 12px 16px;
            font-size: 13px;
            line-height: 1.6;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 12px;
          }
          th {
            background: #078db8;
            color: #ffffff;
            text-align: right;
            padding: 8px 10px;
            font-weight: 700;
          }
          td {
            padding: 8px 10px;
            border-bottom: 1px solid #e2e8f0;
          }
          tr:nth-child(even) td {
            background: #f8fafc;
          }
          .footer {
            margin-top: 40px;
            border-top: 1px solid #e2e8f0;
            padding-top: 12px;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-brand">
            <h1>شركة بلاتينيوم للتطوير العقاري</h1>
            <p>Platinum AI Engine - استوديو التحليل والتصميم المعماري</p>
          </div>
          <div class="report-meta">
            <div><strong>تاريخ التصدير:</strong> ${new Date().toLocaleDateString("ar-SA")}</div>
            <div><strong>المرجع:</strong> AI-ARC-${Math.floor(1000 + Math.random() * 9000)}</div>
          </div>
        </div>

        <div class="section-title">تفاصيل المشروع والوحدة</div>
        <div class="info-grid">
          <div class="info-item"><strong>اسم البناء:</strong> ${buildingName}</div>
          <div class="info-item"><strong>رقم الشقة/الوحدة:</strong> ${formData.apartment_number}</div>
          <div class="info-item"><strong>النمط المعماري:</strong> ${styleLabel}</div>
          <div class="info-item"><strong>المساحة الإجمالية:</strong> ${details.total_area || "غير محددة"}</div>
        </div>

        ${formData.prompt ? `
          <div class="section-title">الوصف الفراغي المطلوب (Prompt)</div>
          <div class="notes-box">${formData.prompt}</div>
        ` : ''}

        ${mainImgUrl ? `
          <div class="section-title">المخطط / التصميم المولد بالذكاء الاصطناعي</div>
          <div class="main-image-container">
            <img src="${mainImgUrl}" alt="Moulded Architectural Design" />
          </div>
        ` : ''}

        ${details.architectural_notes ? `
          <div class="section-title">الملاحظات والتحليل المعماري</div>
          <div class="notes-box">${details.architectural_notes}</div>
        ` : ''}

        ${rooms.length > 0 ? `
          <div class="section-title">جدول توزيع الغرف والمساحات التفصيلية</div>
          <table>
            <thead>
              <tr>
                <th>اسم الفراغ / الغرفة</th>
                <th>المساحة التقديرية</th>
                <th>الوصف والخصائص</th>
              </tr>
            </thead>
            <tbody>
              ${rooms.map((r) => `
                <tr>
                  <td><strong>${r.name || "-"}</strong></td>
                  <td>${r.estimated_area || "-"}</td>
                  <td>${r.description || "-"}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <div class="footer">
          تم إنتاج هذا التقرير تلقائياً بواسطة نظام Platinum AI Engine - جميع الحقوق محفوظة لشركة بلاتينيوم
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(reportHtml);
    printWindow.document.close();
  };

  const mainImageUrl = result?.main_image_url || result?.generated_images?.[0] || result?.data?.main_image_url;
  const resultDetails = result?.details || result?.data?.details;

  return (
    <div className="ai-design-page" dir="rtl">
      <PageHeader
        kicker="Platinum AI Engine"
        title="استوديو التصميم بالذكاء الاصطناعي"
        subtitle="توليد المخططات المعمارية وإكساء المباني فورياً بواسطة نماذج الذكاء الاصطناعي"
      />

      <div className="ai-tabs-container">
        <button
          className={`ai-tab-btn ${activeTab === "from-text" ? "active" : ""}`}
          onClick={() => setActiveTab("from-text")}
        >
          <Wand2 size={18} />
          <span>توليد مخطط من وصف نصي</span>
        </button>

        <button
          className={`ai-tab-btn ${activeTab === "from-building" ? "active" : ""}`}
          onClick={() => setActiveTab("from-building")}
        >
          <ImageIcon size={18} />
          <span>إكساء صورة هيكل عظم</span>
        </button>
      </div>

      {activeTab === "from-text" ? (
        <div className="ai-workspace-grid">
          <div className="ai-card form-section">
            <div className="card-title-bar">
              <Sparkles className="sparkle-icon" size={20} />
              <h3>إعدادات التصميم المطلوب</h3>
              {result }
            </div>

            <form onSubmit={handleSubmitFromText} className="ai-form">
              <div className="form-row">
                <div className="input-group">
                  <label><Building2 size={15} /> البناء</label>
                  <select
                    name="building_id"
                    value={formData.building_id}
                    onChange={handleBuildingChange}
                    required
                    disabled={buildingsLoading}
                  >
                    <option value="">{buildingsLoading ? "جاري تحميل الأبنية..." : "-- اختر البناء --"}</option>
                    {buildings.map((bldg) => (
                      <option key={bldg.id} value={bldg.id}>
                        {bldg.name || bldg.building_name || `بناء رقم ${bldg.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label><Home size={15} /> رقم الشقة / الوحدة</label>
                  <select
                    name="apartment_number"
                    value={formData.apartment_number}
                    onChange={handleInputChange}
                    required
                    disabled={!formData.building_id || unitsLoading}
                  >
                    <option value="">
                      {!formData.building_id
                        ? "-- اختر البناء أولاً --"
                        : unitsLoading
                        ? "جاري تحميل الشقق..."
                        : "-- اختر الشقة --"}
                    </option>
                    {buildingUnits.map((unit) => (
                      <option key={unit.id} value={unit.unit_number || unit.name || unit.number || unit.id}>
                        {unit.unit_number || unit.name || `شقة ${unit.number || unit.id}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label><Palette size={15} /> النمط المعماري (Style)</label>
                <div className="style-selector-grid">
                  {STYLES_OPTIONS.map((style) => (
                    <button
                      type="button"
                      key={style.id}
                      className={`style-card ${formData.style === style.id ? "selected" : ""}`}
                      onClick={() => setFormData((prev) => ({ ...prev, style: style.id }))}
                    >
                      <span className="style-emoji">{style.icon}</span>
                      <span className="style-name">{style.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label><Wand2 size={15} /> وصف الشقة والتوزيع الفراغي (Prompt)</label>
                <textarea
                  name="prompt"
                  rows={5}
                  value={formData.prompt}
                  onChange={handleInputChange}
                  placeholder="اصف تفاصيل المساحة والغرف... مثلاً: شقة بمساحة 150 متر مربع، غرفتين نوم وصالون كبير ومطبخ وحمام مع بلكونة..."
                  required
                />
              </div>

              {error && (
                <div className="ai-error-box">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" className="submit-ai-btn" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={18} className="spinner" />
                    <span>جاري معالجة وتوليد المخطط...</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>توليد المخطط الآن</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="ai-card result-section">
            <div className="card-title-bar card-title-between">
              <div className="title-with-icon">
                <Layers size={20} />
                <h3>نتيجة التوليد والتحليل المعماري</h3>
              </div>
              {result && (
                <button
                  type="button"
                  className="export-report-btn"
                  onClick={handleExportFullReport}
                  title="تصدير التقرير والبيانات كملف PDF"
                >
                  <FileDown size={16} />
                  <span>تصدير تقرير PDF</span>
                </button>
              )}
            </div>

            {loading ? (
              <div className="ai-loading-state">
                <div className="ai-pulse-loader">
                  <Sparkles size={40} />
                </div>
                <h4>جاري تحليل النص وإنشاء المخطط الهيكلي...</h4>
                <p>يقوم الذكاء الاصطناعي الآن بتقسيم المساحات واستخراج التوزيع الأمثل للغرف.</p>
              </div>
            ) : result ? (
              <div className="result-content">
                {mainImageUrl && (
                  <div className="main-generated-image-box">
                    <img src={mainImageUrl} alt="AI Generated Design" className="generated-img" />
                    <div className="image-overlay-actions">
                      <button
                        className="img-action-btn"
                        onClick={() => setPreviewImage(mainImageUrl)}
                        title="معاينة بكامل الشاشة"
                      >
                        <Maximize2 size={16} />
                      </button>
                      <a
                        href={mainImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="img-action-btn"
                        title="تحميل الصورة"
                      >
                        <Download size={16} />
                      </a>
                    </div>
                  </div>
                )}

                {resultDetails && (
                  <div className="architectural-details-wrapper">
                    <div className="area-header-pill">
                      <Ruler size={18} />
                      <span>
                        المساحة الإجمالية: <strong>{resultDetails?.total_area || "غير محددة"}</strong>
                      </span>
                    </div>

                    {resultDetails?.architectural_notes && (
                      <div className="arch-notes-box">
                        <div className="notes-title">
                          <Compass size={16} /> الملاحظات المعمارية:
                        </div>
                        <p>{resultDetails?.architectural_notes}</p>
                      </div>
                    )}

                    {resultDetails?.rooms?.length > 0 && (
                      <div className="rooms-distribution">
                        <div className="notes-title">توزيع الغرف والمساحات التقديرية:</div>
                        <div className="rooms-grid">
                          {resultDetails?.rooms.map((room, idx) => (
                            <div key={idx} className="room-card">
                              <div className="room-card-head">
                                <span className="room-name">{room.name}</span>
                                <span className="room-area">{room.estimated_area}</span>
                              </div>
                              <p className="room-desc">{room.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="ai-empty-state">
                <Wand2 size={48} />
                <h4>جاهز لتوليد المخطط</h4>
                <p>اختر البناء والشقة واكتب تفاصيل التصميم المطلوب لبدء عملية التوليد.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="ai-card coming-soon-card">
          <ImageIcon size={50} />
          <h3>ميزة إكساء المباني الهيكلية (عالعضم)</h3>
          <p>هذا الخيار سيتيح لك رفع صورة مبنى عظم ليقوم الذكاء الاصطناعي برسم التصميم الخارجي والداخلي واكسائه تلقائياً.</p>
        </div>
      )}

      {previewImage && (
        <Modal open={Boolean(previewImage)} onClose={() => setPreviewImage(null)} title="معاينة المخطط المولد" size="lg">
          <div className="ai-image-modal">
            <img src={previewImage} alt="Large AI Generated Plan" />
          </div>
        </Modal>
      )}
    </div>
  );
}