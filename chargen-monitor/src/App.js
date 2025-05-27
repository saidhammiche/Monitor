import React, { useState, useEffect } from 'react'; 
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
    hour12: false,
  });
}

function toDateTimeLocal(dateTimeStr) {
  if (!dateTimeStr) return '';
  const date = new Date(dateTimeStr);
  const isoString = date.toISOString();
  return isoString.substring(0, 16);
}

function App() {
  const [chargeIds, setChargeIds] = useState([]);
  const [formData, setFormData] = useState({
    chargenNr: '',
    startzeit: '',
    endzeit: '',
    anzahlBloeckeGut: '',
    anzahlBloeckeSchlecht: '',
    anzahlBlocke: '',
  });

  const [loadingIds, setLoadingIds] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [chargeData, setChargeData] = useState([]);
  const [zogihortigeDaten, setZogihortigeDaten] = useState(null);
  const [loadingZogihortige, setLoadingZogihortige] = useState(false);

  const fetchZogihortigeDaten = async () => {
    if (!formData.chargenNr) {
      alert('Bitte wählen Sie zuerst eine ChargenNr aus!');
      return;
    }
    
    setLoadingZogihortige(true);
    try {
      const response = await fetch(`http://localhost:5000/api/efcharge/${formData.chargenNr}`);
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Daten');
      }
      const data = await response.json();
      setZogihortigeDaten(data);
    } catch (error) {
      alert(error.message);
      console.error(error);
    } finally {
      setLoadingZogihortige(false);
    }
  };

  useEffect(() => {
    const fetchChargeIds = async () => {
      setLoadingIds(true);
      try {
        const response = await fetch('http://localhost:5000/api/chargeids');
        if (!response.ok) {
          const errorData = await response.json();
          alert(errorData.error || 'Fehler beim Laden der ChargeIDs');
          setChargeIds([]);
        } else {
          const data = await response.json();
          setChargeIds(data);
        }
      } catch (error) {
        alert('Verbindungsfehler zum Server beim Laden der ChargeIds');
        console.error(error);
      } finally {
        setLoadingIds(false);
      }
    };
    fetchChargeIds();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'chargenNr') {
      setChargeData([]);
      setZogihortigeDaten(null);
      setFormData(prev => ({
        ...prev,
        startzeit: '',
        endzeit: '',
        anzahlBloeckeGut: '',
        anzahlBloeckeSchlecht: '',
        anzahlBlocke: '',
      }));
    }
  };

  const loadGehoerteDaten = async () => {
    if (!formData.chargenNr) {
      alert('Bitte wählen Sie eine ChargenNr aus!');
      return;
    }
    setLoadingData(true);
    try {
      const response = await fetch(`http://localhost:5000/api/charge/${formData.chargenNr}`);
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || 'Fehler beim Laden der Daten');
        setFormData(prev => ({
          ...prev,
          startzeit: '',
          endzeit: '',
          anzahlBlocke: '',
          anzahlBloeckeGut: '',
          anzahlBloeckeSchlecht: '',
        }));
        setChargeData([]);
      } else {
        const data = await response.json();
        setChargeData(data.details || []);
        setFormData(prev => ({
          ...prev,
          startzeit: data.startzeit || '',
          endzeit: data.endzeit || '',
          anzahlBloeckeGut: data.anzahlBloeckeGut ?? '',
          anzahlBloeckeSchlecht: data.anzahlBloeckeSchlecht ?? '',
          anzahlBlocke: (Number(data.anzahlBloeckeGut) || 0) + (Number(data.anzahlBloeckeSchlecht) || 0),
        }));
      }
    } catch (error) {
      alert('Verbindungsfehler zum Server beim Laden der Daten');
      console.error(error);
    } finally {
      setLoadingData(false);
    }
  };

  const generatePDF = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const leftMargin = 15;
    let y = 20;

    pdf.setFontSize(18);
    pdf.setTextColor('#0d6efd');
    pdf.text('Chargen Monitor Bericht', pdf.internal.pageSize.getWidth() / 2, y, { align: 'center' });
    y += 15;

    const now = new Date();
    const dateStr = now.toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' });
    pdf.setFontSize(10);
    pdf.setTextColor('#6c757d');
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
    printField('Startzeit', formatDateTime(formData.startzeit));
    printField('Endzeit', formatDateTime(formData.endzeit));
    printField('Blöcke (Gut)', formData.anzahlBloeckeGut);
    printField('Blöcke (Schlecht)', formData.anzahlBloeckeSchlecht);
    printField('Blöcke (Gesamt)', formData.anzahlBlocke);



      if (zogihortigeDaten) {
    y += 15;
    pdf.setFontSize(14);
    pdf.setTextColor('#0d6efd');
    pdf.text('Zugihörige Daten', leftMargin, y);
    y += 15; // Espace supplémentaire après le titre

    // Configuration des champs
    const fields = [
      { label: 'NummerPanter', value: zogihortigeDaten.nummerPanter || '-' },
      { label: 'Bezeichnung', value: zogihortigeDaten.bezeichnung || '-' },
      { label: 'Start', value: formatDateTime(zogihortigeDaten.startzeit) },
      { label: 'Ende', value: formatDateTime(zogihortigeDaten.endzeit) },
      { label: 'BlokOk', value: zogihortigeDaten.anzahlBloeckeGut?.toString() || '0' },
      { label: 'BlokSchlecht', value: zogihortigeDaten.anzahlBloeckeSchlecht?.toString() || '0' },
      { label: 'Gesamt', value: zogihortigeDaten.anzahlBlocke?.toString() || '0' }
    ];

    // Affichage avec style distinctif
    fields.forEach((field) => {
      // Label en gras + bleu
      pdf.setFontSize(11);
      pdf.setTextColor('#0d6efd'); // Bleu Bootstrap
      pdf.setFont(undefined, 'bold');
      pdf.text(`${field.label} :`, leftMargin, y);
      
      // Valeur en noir + décalée
      pdf.setFontSize(11);
      pdf.setTextColor('#000000');
      pdf.setFont(undefined, 'normal');
      pdf.text(field.value, leftMargin + 40, y); // Décalage de 40mm
      
      y += 10; // Espacement généreux entre les lignes
    });
  }

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
            <div className="card shadow-lg rounded-4 border-0">
              <div className="card-header bg-primary text-white rounded-top-4 d-flex justify-content-between align-items-center">
                <h3 className="mb-0">🔧 Chargen Monitor</h3>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">ChargenNr auswählen</label>
                  <select
                    className="form-select"
                    name="chargenNr"
                    value={formData.chargenNr}
                    onChange={handleChange}
                    disabled={loadingIds}
                  >
                    <option value="">-- Bitte wählen --</option>
                    {chargeIds.map((id) => (
                      <option key={id} value={id}>
                        {id}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Startzeit</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    name="startzeit"
                    value={toDateTimeLocal(formData.startzeit)}
                    readOnly
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Endzeit</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    name="endzeit"
                    value={toDateTimeLocal(formData.endzeit)}
                    readOnly
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Blöcke Gut</label>
                  <input
                    type="number"
                    className="form-control"
                    name="anzahlBloeckeGut"
                    value={formData.anzahlBloeckeGut}
                    readOnly
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Blöcke Schlecht</label>
                  <input
                    type="number"
                    className="form-control"
                    name="anzahlBloeckeSchlecht"
                    value={formData.anzahlBloeckeSchlecht}
                    readOnly
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Blöcke Gesamt</label>
                  <input
                    type="number"
                    className="form-control"
                    name="anzahlBlocke"
                    value={formData.anzahlBlocke}
                    readOnly
                  />
                </div>

                <div className="d-flex justify-content-between mt-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={loadGehoerteDaten}
                    disabled={loadingData || !formData.chargenNr}
                  >
                    {loadingData ? 'Laden...' : 'Daten laden'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-success px-4 py-2 rounded-3 shadow-sm"
                    onClick={generatePDF}
                    disabled={!formData.chargenNr}
                  >
                    <i className="bi bi-file-earmark-pdf-fill me-2"></i>
                    PDF generieren
                  </button>
                </div>

                <div className="mt-3">
                  <button
                    type="button"
                    className="btn btn-info"
                    onClick={fetchZogihortigeDaten}
                    disabled={loadingZogihortige || !formData.chargenNr}
                  >
                    {loadingZogihortige ? 'Laden...' : 'ZogihortigeDaten'}
                  </button>
                </div>

                {zogihortigeDaten && (
                  <div className="mt-4">
                    <h5 className="mb-3">Zogihortige Daten für Charge {formData.chargenNr}</h5>
                    <div className="table-responsive">
                      <table className="table table-bordered table-striped">
                        <thead className="table-primary">
                          <tr>
                            <th>NummerPanter</th>
                            <th>Bezeichnung</th>
                            <th>Startzeit</th>
                            <th>Endzeit</th>
                            <th>Blöcke Gut</th>
                            <th>Blöcke Schlecht</th>
                            <th>Blöcke Gesamt</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>{zogihortigeDaten.nummerPanter || '-'}</td>
                            <td>{zogihortigeDaten.bezeichnung || '-'}</td>
                            <td>{formatDateTime(zogihortigeDaten.startzeit)}</td>
                            <td>{formatDateTime(zogihortigeDaten.endzeit)}</td>
                            <td>{zogihortigeDaten.anzahlBloeckeGut || '0'}</td>
                            <td>{zogihortigeDaten.anzahlBloeckeSchlecht || '0'}</td>
                            <td>{zogihortigeDaten.anzahlBlocke || '0'}</td>
                          </tr>
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
    </>
  );
}

export default App;