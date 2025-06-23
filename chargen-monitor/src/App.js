import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';


function toDateTimeLocal(dateTimeStr) {
  if (!dateTimeStr) return '';

  
  const match = dateTimeStr.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);

  if (match) {
    return match[1];  
  } else {
    return dateTimeStr; 
  }
}



function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return '-';
  const match = dateTimeStr.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})/);
  
  if (match) {
    return `${match[1]} ${match[2]}`;
  } else {
    
    return dateTimeStr;
  }
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
    lieferant: '',
    sorte: ''
  });

  const [loadingIds, setLoadingIds] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const [zogihortigeDaten, setZogihortigeDaten] = useState(null);
  const [loadingZogihortige, setLoadingZogihortige] = useState(false);
  const [blocks, setBlocks] = useState([]);


  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const fetchZogihortigeDaten = async () => {
    if (!formData.chargenNr) {
      alert('Bitte wählen Sie zuerst eine ChargenNr aus!');
      return;
    }

    setLoadingZogihortige(true);
    try {
      const response = await fetch(`http://4.245.3.186:5000/api/efcharge/${formData.chargenNr}`);
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
        const response = await fetch('http://4.245.3.186:5000/api/chargeids');
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
      setZogihortigeDaten(null);
      setFormData(prev => ({
        ...prev,
        startzeit: '',
        endzeit: '',
        anzahlBloeckeGut: '',
        anzahlBloeckeSchlecht: '',
        anzahlBlocke: '',
        lieferant: '',
        sorte: ''
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
      const response = await fetch(`http://4.245.3.186:5000/api/charge/${formData.chargenNr}`);
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
          lieferant: '',
          sorte: ''
        }));
      } else {
        const result = await response.json();

        setFormData(prev => ({
          ...prev,
          startzeit: result.startzeit || '',
          endzeit: result.endzeit || '',
          anzahlBloeckeGut: result.anzahlBloeckeGut ?? '',
          anzahlBloeckeSchlecht: result.anzahlBloeckeSchlecht ?? '',
          anzahlBlocke: (Number(result.anzahlBloeckeGut) || 0) + (Number(result.anzahlBloeckeSchlecht) || 0),
          lieferant: result.lieferant || '',
          sorte: result.sorte || ''
        }));
      }
    } catch (error) {
      alert('Verbindungsfehler zum Server beim Laden der Daten');
      console.error(error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchBlocks = async () => {
    if (!formData.chargenNr) {
      alert('Bitte wählen Sie zuerst eine ChargenNr aus!');
      return;
    }
    setLoadingBlocks(true);
    try {
      const resp = await fetch(`http://4.245.3.186:5000/api/blocks/${formData.chargenNr}`);
      if (!resp.ok) throw new Error('Fehler beim Laden der Blocke');
      const data = await resp.json();
      setBlocks(data);
    } catch (e) {
      alert(e.message);
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
    printField('Lieferant', formData.lieferant);
    printField('Sorte', formData.sorte);




    if (zogihortigeDaten) {
      y += 15;
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Zugihörige Daten', leftMargin, y);
      y += 15;


      const fields = [
        { label: 'NummerPanter', value: zogihortigeDaten.nummerPanter || '-' },
        { label: 'Bezeichnung', value: zogihortigeDaten.bezeichnung || '-' },
        { label: 'Start', value: formatDateTime(zogihortigeDaten.startzeit) },
        { label: 'Ende', value: formatDateTime(zogihortigeDaten.endzeit) },
        { label: 'BlokOk', value: zogihortigeDaten.anzahlBloeckeGut?.toString() || '0' },
        { label: 'BlokSchlecht', value: zogihortigeDaten.anzahlBloeckeSchlecht?.toString() || '0' },
        { label: 'Gesamt', value: zogihortigeDaten.anzahlBlocke?.toString() || '0' },
        { label: 'Lieferant', value: zogihortigeDaten.lieferant || '-' },
        { label: 'Sorte', value: zogihortigeDaten.sorte || '-' }
      ];


      fields.forEach((field) => {

        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont(undefined, 'bold');
        pdf.text(`${field.label} :`, leftMargin, y);


        pdf.setFontSize(12);
        pdf.setTextColor('#000000');
        pdf.setFont(undefined, 'normal');
        pdf.text(field.value, leftMargin + 40, y);

        y += 10;
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

                <div className="row mb-3">
                  <div className="col">
                    <label className="form-label fw-semibold">Startzeit</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      name="startzeit"
                      value={toDateTimeLocal(formData.startzeit)}
                      readOnly
                    />
                  </div>
                  <div className="col">
                    <label className="form-label fw-semibold">Endzeit</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      name="endzeit"
                      value={toDateTimeLocal(formData.endzeit)}
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
                    <label className="form-label fw-semibold">Blöcke Schlecht</label>
                    <input
                      type="number"
                      className="form-control"
                      name="anzahlBloeckeSchlecht"
                      value={formData.anzahlBloeckeSchlecht}
                      readOnly
                    />
                  </div>
                  <div className="col">
                    <label className="form-label fw-semibold">Blöcke Gut</label>
                    <input
                      type="number"
                      className="form-control"
                      name="anzahlBloeckeGut"
                      value={formData.anzahlBloeckeGut}
                      readOnly
                    />
                  </div>
                  <div className="col">
                    <label className="form-label fw-semibold">Blöcke Gesamt</label>
                    <input
                      type="number"
                      className="form-control"
                      name="anzahlBlocke"
                      value={formData.anzahlBlocke}
                      readOnly
                    />
                  </div>
                </div>
              </div>


              <div className="mb-3 d-flex gap-3">
                <button
                  className="btn btn-outline-primary flex-grow-1"
                  onClick={loadGehoerteDaten}
                  disabled={loadingData || loadingIds || !formData.chargenNr}
                >
                  {loadingData ? 'Lädt...' : 'Daten laden'}
                </button>

                <button
                  className="btn btn-primary flex-grow-1"
                  onClick={generatePDF}
                  disabled={loadingData || loadingIds || !formData.chargenNr}
                >
                  <i className="bi bi-file-earmark-pdf-fill me-2"></i>
                  PDF herunterladen
                </button>

                <button
                  className="btn btn-outline-info flex-grow-1"
                  onClick={fetchZogihortigeDaten}
                  disabled={loadingZogihortige || !formData.chargenNr}
                >
                  {loadingZogihortige ? 'Lädt...' : 'Zugehörige Daten'}
                </button>
              </div>

              {/* Tableau des données zogihortigeDaten avec ligne rouge si anzahlBloeckeSchlecht === 1 */}
              {zogihortigeDaten && (
                <div className="mt-4">
                  <h5 className="mb-3" style={{ textDecoration: 'underline' }}>
                    <i className="bi bi-database me-2"></i>Zugehörige Daten für Charge {formData.chargenNr} : </h5>

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
                          <th>Lieferant</th>
                          <th>Sorte</th>

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
                          <td>{zogihortigeDaten.lieferant || '-'}</td>
                          <td>{zogihortigeDaten.sorte || '-'}</td>





                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="mb-3 d-flex gap-3">
                <button
                  className="btn btn-outline-secondary flex-grow-1"
                  onClick={fetchBlocks}
                  disabled={loadingBlocks || !formData.chargenNr}
                >
                  {loadingBlocks ? 'Lädt...' : 'Zugehörige Blöcke '}
                </button>
              </div>
              {blocks.length > 0 && (
                <div className="mt-4">
                  <h5 className="mb-3" style={{ textDecoration: 'underline' }}>
                    <i className="bi bi-box-seam me-2"></i>Blöcke für Charge {formData.chargenNr} :</h5>

                  <div className="table-responsive">
                    <table className="table table-bordered table-striped">
                      <thead className="table-secondary">
                        <tr>
                          <th>BlockID</th>
                          <th>schlecht</th>
                          <th>Startzeit</th>
                          <th>Endzeit</th>
                          <th>Aktion</th>

                        </tr>
                      </thead>
                      <tbody>
                        {blocks.map((blk) => (
                          <tr
                            key={blk.BlockID}
                            className={blk.schlecht === 1 ? 'table-danger' : ''}
                          >
                            <td>{blk.BlockID}</td>
                            <td>{blk.schlecht}</td>
                            <td>{formatDateTime(blk.Startzeit)}</td>
                            <td>{formatDateTime(blk.Endzeit)}</td>
                            <td>
                              <button className="btn btn-success btn-sm">
                                <i className="bi bi-eye"></i> Details
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

    </>
  );
}

export default App;
