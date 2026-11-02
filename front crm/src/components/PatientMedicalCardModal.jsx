import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Printer, 
  Download, 
  Plus, 
  User, 
  Phone, 
  Loader2 
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import html2pdf from 'html2pdf.js';

export default function PatientMedicalCardModal({ isOpen, onClose, patient }) {
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen || !patient) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    const cleanId = (patient.patientId || 'PATIENT').replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanName = (patient.name || 'Card').replace(/\s+/g, '_');
    const filename = `Medical_Card_${cleanId}_${cleanName}.pdf`;

    try {
      const element = cardRef.current;
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#0f172a',
        onclone: (clonedDoc) => {
          // Clean CSS colors for html2canvas compatibility
          const styleElements = clonedDoc.querySelectorAll('style');
          styleElements.forEach((style) => {
            try {
              if (style.textContent) {
                style.textContent = style.textContent
                  .replace(/oklab\([^)]+\)/gi, '#334155')
                  .replace(/oklch\([^)]+\)/gi, '#334155')
                  .replace(/color-mix\([^)]+\)/gi, '#334155');
              }
            } catch (e) {}
          });
        }
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const margin = 15;
      const maxW = pdfWidth - (margin * 2);
      const maxH = pdfHeight - (margin * 2);

      let renderW = maxW;
      let renderH = (canvas.height * renderW) / canvas.width;

      if (renderH > maxH) {
        renderH = maxH;
        renderW = (canvas.width * renderH) / canvas.height;
      }

      const posX = (pdfWidth - renderW) / 2;
      const posY = (pdfHeight - renderH) / 2;

      pdf.addImage(imgData, 'PNG', posX, posY, renderW, renderH);
      pdf.save(filename);
    } catch (err) {
      console.error('Canvas export failed, falling back to html2pdf:', err);
      try {
        const opt = {
          margin: 15,
          filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };
        await html2pdf().set(opt).from(cardRef.current).save();
      } catch (fallbackErr) {
        console.error('All card PDF exports failed:', fallbackErr);
        alert('Could not export PDF. Please try Print > Save as PDF instead.');
      }
    } finally {
      setDownloading(false);
    }
  };

  // Crisp scan-ready QR code representation
  const renderQRCode = () => (
    <div className="bg-white p-2 rounded-xl shadow-md shrink-0 flex flex-col items-center justify-center">
      <svg className="w-18 h-18 sm:w-20 sm:h-20" viewBox="0 0 29 29" fill="#0f172a" shapeRendering="crispEdges">
        {/* Position markers */}
        <path d="M0,0 h7 v7 h-7 z M1,1 v5 h5 v-5 z M2,2 h3 v3 h-3 z" />
        <path d="M22,0 h7 v7 h-7 z M23,1 v5 h5 v-5 z M24,2 h3 v3 h-3 z" />
        <path d="M0,22 h7 v7 h-7 z M1,23 v5 h5 v-5 z M2,24 h3 v3 h-3 z" />

        {/* Timing patterns */}
        <rect x="8" y="3" width="1" height="1" />
        <rect x="10" y="3" width="1" height="1" />
        <rect x="12" y="3" width="1" height="1" />
        <rect x="14" y="3" width="1" height="1" />
        <rect x="16" y="3" width="1" height="1" />
        <rect x="18" y="3" width="1" height="1" />
        <rect x="20" y="3" width="1" height="1" />

        <rect x="3" y="8" width="1" height="1" />
        <rect x="3" y="10" width="1" height="1" />
        <rect x="3" y="12" width="1" height="1" />
        <rect x="3" y="14" width="1" height="1" />
        <rect x="3" y="16" width="1" height="1" />
        <rect x="3" y="18" width="1" height="1" />
        <rect x="3" y="20" width="1" height="1" />

        {/* Alignment box */}
        <path d="M20,20 h5 v5 h-5 z M21,21 v3 h3 v-3 z M22,22 h1 v1 h-1 z" />

        {/* Data points */}
        <rect x="9" y="1" width="2" height="2" />
        <rect x="13" y="1" width="2" height="2" />
        <rect x="17" y="1" width="2" height="2" />
        <rect x="9" y="5" width="2" height="2" />
        <rect x="15" y="5" width="2" height="2" />
        <rect x="9" y="9" width="3" height="3" />
        <rect x="14" y="9" width="2" height="2" />
        <rect x="18" y="9" width="2" height="2" />
        <rect x="23" y="9" width="2" height="2" />
        <rect x="27" y="9" width="2" height="2" />
        <rect x="1" y="13" width="2" height="2" />
        <rect x="9" y="13" width="2" height="2" />
        <rect x="13" y="13" width="3" height="3" />
        <rect x="18" y="13" width="2" height="2" />
        <rect x="25" y="13" width="2" height="2" />
        <rect x="3" y="17" width="2" height="2" />
        <rect x="9" y="17" width="2" height="2" />
        <rect x="14" y="17" width="2" height="2" />
        <rect x="18" y="17" width="3" height="3" />
        <rect x="23" y="17" width="2" height="2" />
        <rect x="9" y="23" width="2" height="2" />
        <rect x="13" y="23" width="2" height="2" />
        <rect x="17" y="23" width="2" height="2" />
        <rect x="25" y="23" width="2" height="2" />
        <rect x="11" y="26" width="2" height="2" />
        <rect x="15" y="26" width="2" height="2" />
        <rect x="21" y="26" width="2" height="2" />
      </svg>
      <span className="text-[7.5px] font-mono font-bold text-slate-800 tracking-wider mt-1 uppercase">
        Check-In QR
      </span>
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      {/* Print-specific style */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-medical-card, #printable-medical-card * {
            visibility: visible !important;
          }
          #printable-medical-card {
            position: absolute !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-4 sm:p-6 max-w-xl w-full shadow-2xl my-auto flex flex-col">
        {/* Modal Top Actions */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <Plus className="w-4 h-4 stroke-[3]" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Medical ID Card Preview
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>

            <button
              type="button"
              disabled={downloading}
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              {downloading ? 'Exporting...' : 'Download PDF'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Card Viewport Area */}
        <div className="py-6 flex items-center justify-center">
          {/* ════════════ MEDICAL CARD ════════════ */}
          <div
            id="printable-medical-card"
            ref={cardRef}
            className="w-full max-w-[440px] rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-slate-900 via-[#0c1424] to-slate-900 border border-slate-700/60 shadow-2xl text-white flex flex-col justify-between relative overflow-hidden"
            style={{ minHeight: '240px' }}
          >
            {/* Ambient background glow */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/[0.04] rounded-full blur-2xl pointer-events-none" />

            {/* 1. Clinic Header + 2. Blood Group Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-sm">
                  <Plus className="w-4 h-4 stroke-[3.5]" />
                </div>
                <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white">
                  POLYCLINIC MEDICAL ID CARD
                </h3>
              </div>

              {/* Blood Group Badge: Clean, high-visibility pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-300 font-black text-xs shadow-xs tracking-wide">
                <span>🩸</span>
                <span>{patient.bloodGroup || 'O+'}</span>
              </div>
            </div>

            {/* 3. Patient Details + 4. Reception QR Code */}
            <div className="py-3 flex items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Avatar */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center text-slate-400 shrink-0 shadow-inner">
                  <User className="w-8 h-8 sm:w-9 sm:h-9" />
                </div>

                {/* Patient Details */}
                <div className="min-w-0 space-y-1">
                  <h4 className="text-sm sm:text-base font-black text-white truncate tracking-tight">
                    {patient.name}
                  </h4>

                  <div className="text-xs font-mono font-bold text-emerald-400 tracking-wider">
                    {patient.patientId || 'PAT-1001'}
                  </div>

                  <div className="text-xs text-slate-300 font-medium">
                    {patient.age ? `${patient.age} Yrs` : '--'} • {patient.gender || 'Male'}
                  </div>

                  <div className="text-xs text-slate-300 flex items-center gap-1.5 font-medium truncate">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{patient.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Crisp Reception QR Code */}
              <div className="shrink-0">
                {renderQRCode()}
              </div>
            </div>

            {/* 5. Minimal Footer */}
            <div className="pt-2.5 border-t border-slate-800 flex items-center justify-center text-xs font-bold text-rose-400 tracking-wide relative z-10">
              Emergency: 1800-419-CARE
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
