import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return '-';
  const date = new Date(dateTimeStr);
  return date.toLocaleString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false, // Heure 24h
  });
}

function App() {
  const [formData, setFormData] = useState({
    chargenNr: '',
    startzeit: '',
    endzeit: '',
    anzahlBlocke: '',
    status: 'Gut',
    daten: ''
  });

  const [loading, setLoading] = useState(false);
  const pdfRef = useRef();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const loadGehoerteDaten = () => {
    if (!formData.chargenNr.trim()) {
      alert('Bitte geben Sie eine ChargenNr ein!');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      // Simulation de récupération des données depuis la base
      setFormData(prev => ({
        ...prev,
        daten: 'Hier sind die zugehörigen Daten (Simuliert)',
        startzeit: '2025-05-23T08:30',
        endzeit: '2025-05-23T17:00'
      }));
      setLoading(false);
    }, 2000);
  };

  const generatePDF = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const leftMargin = 15;
    let y = 20;

    pdf.setFontSize(18);
    pdf.setTextColor('#0d6efd'); // bleu bootstrap
    pdf.text('Chargen Monitor Bericht', pdf.internal.pageSize.getWidth() / 2, y, { align: 'center' });

    y += 15;

    const now = new Date();
    const dateStr = now.toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' });
    pdf.setFontSize(10);
    pdf.setTextColor('#6c757d'); // gris bootstrap
    pdf.text(`Erstellt am: ${dateStr}`, leftMargin, y);

    y += 10;

    pdf.setDrawColor('#0d6efd');
    pdf.setLineWidth(0.5);
    pdf.line(leftMargin, y, pdf.internal.pageSize.getWidth() - leftMargin, y);

    y += 10;

    const printField = (label, value) => {
      pdf.setFontSize(12);
      pdf.setTextColor('#212529');
      pdf.text(label + ':', leftMargin, y);
      pdf.setFontSize(12);
      pdf.setTextColor('#495057');
      pdf.text(String(value || '-'), leftMargin + 50, y);
      y += 10;
    };

    printField('ChargenNr', formData.chargenNr);
    printField('Startzeit', formData.startzeit ? formatDateTime(formData.startzeit) : '-');
    printField('Endzeit', formData.endzeit ? formatDateTime(formData.endzeit) : '-');
    printField('Anzahl Blöcke', formData.anzahlBlocke);
    printField('Status', formData.status);
    printField('Chargegehörte Daten', formData.daten || '-');

    y += 10;

    pdf.setFontSize(9);
    pdf.setTextColor('#6c757d');
    pdf.text('MRS Metall Recycling Service Willich GmbH & Co. KG', leftMargin, pdf.internal.pageSize.getHeight() - 15);

    pdf.save(`ChargenNr_${formData.chargenNr || 'Bericht'}.pdf`);
  };

  return (
    <>
      <nav className="navbar navbar-dark bg-dark shadow rounded-bottom-4 mb-4">
        <div className="container">
          <span className="navbar-brand mb-0 h1 fs-5">
            🏭 MRS Metall Recycling Service Willich GmbH & Co. KG
          </span>
        </div>
      </nav>

      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card shadow-lg rounded-4 border-0" ref={pdfRef}>
              <div className="card-header bg-primary text-white rounded-top-4">
                <h3 className="mb-0">🔧 Chargen Monitor</h3>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">ChargenNr</label>
                  <input
                    type="text"
                    className="form-control"
                    name="chargenNr"
                    onChange={handleChange}
                    value={formData.chargenNr}
                    placeholder="ChargenNr eingeben"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Startzeit</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    name="startzeit"
                    value={formData.startzeit}
                    readOnly
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Endzeit</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    name="endzeit"
                    value={formData.endzeit}
                    readOnly
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Anzahl Blöcke</label>
                  <input
                    type="number"
                    className="form-control"
                    name="anzahlBlocke"
                    onChange={handleChange}
                    value={formData.anzahlBlocke}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Status</label><br />
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="status"
                      value="Gut"
                      checked={formData.status === 'Gut'}
                      onChange={handleChange}
                    />
                    <label className="form-check-label">✅ Gut</label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="status"
                      value="Schlecht"
                      checked={formData.status === 'Schlecht'}
                      onChange={handleChange}
                    />
                    <label className="form-check-label">❌ Schlecht</label>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Chargegehörte Daten</label>
                  <textarea
                    className="form-control mb-2"
                    rows="3"
                    name="daten"
                    value={formData.daten}
                    readOnly
                  ></textarea>

                  {loading && (
                    <div className="progress mb-2">
                      <div className="progress-bar progress-bar-striped progress-bar-animated bg-info" style={{ width: '100%' }}>
                        Laden...
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={loadGehoerteDaten}
                    disabled={loading}
                  >
                    🔍 Lade zugehörige Daten
                  </button>
                </div>

                <div className="text-end">
                  <button
                    type="button"
                    className="btn btn-success px-4 py-2 rounded-3 shadow-sm"
                    onClick={generatePDF}
                  >
                    <i className="bi bi-file-earmark-pdf-fill me-2"></i>
                    PDF generieren
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
