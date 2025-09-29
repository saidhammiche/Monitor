import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return '-';
  const cleaned = dateTimeStr.replace('Z', '').split('.')[0];
  return cleaned.replace('T', ' ');
}

function App() {
  const [formData, setFormData] = useState({
    chargenNr: '',
    startzeit: '',
    endzeit: '',
    anzahlBloeckeGut: '',
    anzahlBloeckeSchlecht: '',
    anzahlBlocke: '',
    lieferant: '',
    sorte: ''
  });

  const [loadingData, setLoadingData] = useState(false);
  const [zogihortigeDaten, setZogihortigeDaten] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // Fonction pour afficher les notifications
  const showNotification = (message, type = 'danger') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 5000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const loadChargeData = async () => {
    if (!formData.chargenNr) {
      showNotification('Bitte geben Sie eine ChargeID ein!', 'warning');
      return;
    }

    setLoadingData(true);
    try {
      const response = await fetch(`http://48.209.33.37:5004/api/efcharge/${formData.chargenNr}`);
      if (!response.ok) {
        throw new Error('Charge nicht gefunden');
      }
      const data = await response.json();

      setFormData(prev => ({
        ...prev,
        chargenNr: data.chargenNr,
        startzeit: data.startzeit,
        endzeit: data.endzeit,
        anzahlBloeckeGut: data.anzahlBloeckeGut,
        anzahlBloeckeSchlecht: data.anzahlBloeckeSchlecht,
        anzahlBlocke: data.anzahlBlocke,
        lieferant: data.lieferant,
        sorte: data.sorte
      }));

      showNotification('Charge erfolgreich geladen!', 'success');

    } catch (error) {
      showNotification('Die angeforderte Charge konnte nicht gefunden werden. Bitte überprüfen Sie die Buchungsnummer.', 'danger');
      console.error(error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchBlocks = async () => {
    if (!formData.chargenNr) {
      showNotification('Bitte geben Sie eine ChargeID ein!', 'warning');
      return;
    }
    setLoadingBlocks(true);
    try {
      const resp = await fetch(`http://48.209.33.37:5004/api/blocks/${formData.chargenNr}`);
      if (!resp.ok) throw new Error('Fehler beim Laden der Blöcke');
      const data = await resp.json();
      setBlocks(data);
      showNotification('Blöcke erfolgreich geladen!', 'success');
    } catch (e) {
      showNotification('Fehler beim Laden der Blöcke. Bitte versuchen Sie es erneut.', 'danger');
      console.error(e);
    } finally {
      setLoadingBlocks(false);
    }
  };

  const generatePDF = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const leftMargin = 15;
    let y = 20;

    pdf.setFontSize(18);
    pdf.setTextColor('#3b7695');
    pdf.text('Chargen Monitor Bericht', pdf.internal.pageSize.getWidth() / 2, y, { align: 'center' });
    y += 15;

    const now = new Date();
    const dateStr = now.toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' });
    pdf.setFontSize(10);
    pdf.setTextColor('#6c757d');
    pdf.text(`Erstellt am: ${dateStr}`, leftMargin, y);
    y += 10;

    pdf.setDrawColor('#3b7695');
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
    printField('Startzeit', formatDateTime(formData.startzeit));
    printField('Endzeit', formatDateTime(formData.endzeit));
    printField('Blöcke (Gut)', formData.anzahlBloeckeGut);
    printField('Blöcke (Schlecht)', formData.anzahlBloeckeSchlecht);
    printField('Blöcke (Gesamt)', formData.anzahlBlocke);
    printField('Lieferant', formData.lieferant);
    printField('Sorte', formData.sorte);

    y += 10;
    pdf.setFontSize(9);
    pdf.setTextColor('#6c757d');
    pdf.text('MRS Metall Recycling Service Willich GmbH & Co. KG', leftMargin, pdf.internal.pageSize.getHeight() - 15);

    pdf.save(`ChargenNr_${formData.chargenNr || 'Bericht'}.pdf`);
  };

  const handleBlockClick = (block) => {
    if (block.link) {
      window.open(block.link, '_blank');
    } else {
      showNotification('Lien non disponible pour ce bloc.', 'warning');
    }
  };

  return (
    <div className="container py-5">
      {/* Notification professionnelle */}
      {notification.show && (
        <div className={`alert alert-${notification.type} alert-dismissible fade show mb-4`} role="alert">
          <div className="d-flex align-items-center">
            <i className={`bi ${
              notification.type === 'success' ? 'bi-check-circle-fill' : 
              notification.type === 'warning' ? 'bi-exclamation-triangle-fill' : 
              'bi-exclamation-octagon-fill'
            } me-2`}></i>
            <span>{notification.message}</span>
          </div>
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setNotification({ show: false, message: '', type: '' })}
          ></button>
        </div>
      )}

      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow-lg rounded-4 border-0">
            <div className="card-header text-white rounded-top-4 d-flex justify-content-between align-items-center"
              style={{ backgroundColor: '#3b7695', borderColor: '#3b7695' }}>
              <h3 className="mb-0">🔧 Chargen Monitor</h3>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col">
                  <label className="form-label fw-semibold">Buchungsnummer</label>
                  <input
                    type="text"
                    className="form-control"
                    name="chargenNr"
                    value={formData.chargenNr}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-auto d-flex align-items-end">
                  <button
                    className="btn"
                    onClick={loadChargeData}
                    disabled={loadingData}
                    style={{
                      backgroundColor: '#3b7695',
                      borderColor: '#3b7695',
                      color: 'white'
                    }}
                  >
                    {loadingData ? 'Lädt...' : 'Daten laden'}
                  </button>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col">
                  <label className="form-label fw-semibold">Startzeit</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formatDateTime(formData.startzeit)}
                    readOnly
                  />
                </div>
                <div className="col">
                  <label className="form-label fw-semibold">Endzeit</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formatDateTime(formData.endzeit)}
                    readOnly
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col">
                  <label className="form-label fw-semibold">Lieferant</label>
                  <input
                    type="text"
                    className="form-control"
                    name="lieferant"
                    value={formData.lieferant}
                    readOnly
                  />
                </div>
                <div className="col">
                  <label className="form-label fw-semibold">Sorte</label>
                  <input
                    type="text"
                    className="form-control"
                    name="sorte"
                    value={formData.sorte}
                    readOnly
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col">
                  <label className="form-label fw-semibold">Pakete ohne Befund</label>
                  <input
                    type="number"
                    className="form-control"
                    name="anzahlBloeckeGut"
                    value={formData.anzahlBloeckeGut}
                    readOnly
                  />
                </div>
                <div className="col">
                  <label className="form-label fw-semibold">Pakete mit Fe</label>
                  <input
                    type="number"
                    className="form-control"
                    name="anzahlBloeckeSchlecht"
                    value={formData.anzahlBloeckeSchlecht}
                    readOnly
                  />
                </div>
                <div className="col">
                  <label className="form-label fw-semibold">Pakete Gesamt</label>
                  <input
                    type="number"
                    className="form-control"
                    name="anzahlBlocke"
                    value={formData.anzahlBlocke}
                    readOnly
                  />
                </div>
              </div>

              <div className="mb-3 d-flex gap-3">
                <button
                  className="btn flex-grow-1"
                  onClick={generatePDF}
                  disabled={!formData.chargenNr}
                  style={{
                    backgroundColor: '#3b7695',
                    borderColor: '#3b7695',
                    color: 'white'
                  }}
                >
                  <i className="bi bi-file-earmark-pdf-fill me-2"></i>
                  PDF herunterladen
                </button>

                <button
                  className="btn flex-grow-1"
                  onClick={async () => {
                    if (!formData.chargenNr) {
                      showNotification('Bitte geben Sie eine ChargeID ein!', 'warning');
                      return;
                    }
                    try {
                      const response = await fetch(`http://48.209.33.37:5004/api/efcharge/${formData.chargenNr}`);
                      if (!response.ok) throw new Error('Daten nicht gefunden');
                      const data = await response.json();
                      setZogihortigeDaten(data);
                      showNotification('Chargendaten erfolgreich angezeigt!', 'success');
                    } catch (error) {
                      showNotification('Chargendaten konnten nicht geladen werden.', 'danger');
                    }
                  }}
                  disabled={!formData.chargenNr}
                  style={{
                    backgroundColor: '#3b7695',
                    borderColor: '#3b7695',
                    color: 'white'
                  }}
                >
                  <i className="bi bi-eye-fill me-2"></i>
                  Chargen Anzeigen
                </button>

                <button
                  className="btn flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                  style={{
                    backgroundColor: '#3b7695',
                    borderColor: '#3b7695',
                    color: 'white'
                  }} 
                  onClick={fetchBlocks}
                  disabled={loadingBlocks || !formData.chargenNr}
                >
                  <i className="bi bi-box-seam"></i>
                  {loadingBlocks ? 'Lädt...' : 'Blöcke Anzeigen'}
                </button>
              </div>

              {zogihortigeDaten && (
                <div className="mt-4">
                  <h5 className="mb-3" style={{ textDecoration: 'underline' }}>
                    <i className="bi bi-database me-2"></i>Zugehörige Daten für Charge {formData.chargenNr} :
                  </h5>
                  <div className="table-responsive">
                    <table className="table table-bordered table-striped">
                      <thead className="table-primary">
                        <tr>
                          <th>Buchungsnummer</th>
                          
                          <th>Bezeichnung</th>
                          <th>Startzeit</th>
                          <th>Endzeit</th>
                          <th>Pakete ohne Befund</th>
                          <th>Pakete mit Fe</th>
                          <th>Pakete Gesamt</th>
                          <th>Lieferant</th>
                          <th>Sorte</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{zogihortigeDaten.chargenNr || '-'}</td>
                        
                          <td>{zogihortigeDaten.bezeichnung || '-'}</td>
                          <td>{formatDateTime(zogihortigeDaten.startzeit)}</td>
                          <td>{formatDateTime(zogihortigeDaten.endzeit)}</td>
                          <td>{zogihortigeDaten.anzahlBloeckeGut || '0'}</td>
                          <td>{zogihortigeDaten.anzahlBloeckeSchlecht || '0'}</td>
                          <td>{zogihortigeDaten.anzahlBlocke || '0'}</td>
                          <td>{zogihortigeDaten.lieferant || '-'}</td>
                          <td>{zogihortigeDaten.sorte || '-'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {blocks.length > 0 && (
                <div className="mt-4">
                  <h5 className="mb-3" style={{ textDecoration: 'underline' }}>
                    <i className="bi bi-box-seam me-2"></i>Blöcke für Charge {formData.chargenNr} :
                  </h5>
                  <div className="table-responsive">
                    <table className="table table-bordered table-striped">
                      <thead className="table-secondary">
                        <tr>
                          <th>BlockID</th>
                          <th>schlecht</th>
                          <th>Startzeit</th>
                          <th>Endzeit</th>
                          <th>Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {blocks.map((blk) => (
                          <tr
                            key={blk.BlockID}
                            className={blk.schlecht === 1 ? "table-danger" : ""}
                          >
                            <td>{blk.BlockID}</td>
                            <td>{blk.schlecht}</td>
                            <td>{formatDateTime(blk.Startzeit)}</td>
                            <td>{formatDateTime(blk.Endzeit)}</td>
                            <td>
                              <button
                                className="btn btn-outline-success d-flex align-items-center gap-2"
                                onClick={() => handleBlockClick(blk)}
                                style={{
                                  backgroundColor: '#3b7695',
                                  borderColor: '#3b7695',
                                  color: 'white'
                                }}
                              >
                                <i className="bi bi-gear-fill"></i>
                                Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;