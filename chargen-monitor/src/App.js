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
    lieferant: '',
    sorte: ''
  });

  const [loadingIds, setLoadingIds] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const [zogihortigeDaten, setZogihortigeDaten] = useState(null);
  const [loadingZogihortige, setLoadingZogihortige] = useState(false);
  const [blocks, setBlocks] = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [zeitPaare, setZeitPaare] = useState([]);

  useEffect(() => {
    const fetchZeitPaare = async () => {
      try {
        const response = await fetch('http://4.245.3.186:5000/api/zeitpaare');
        const data = await response.json();
        setZeitPaare(data);
      } catch (error) {
        console.error('Fehler beim Laden der Zeitpaare', error);
      }
    };

    fetchZeitPaare();
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
    const { startzeit, endzeit } = formData;

    if (!startzeit || !endzeit) {
      alert('Bitte wählen Sie Startzeit und Endzeit aus!');
      return;
    }

    setLoadingData(true);
    try {
      const response = await fetch(`http://4.245.3.186:5000/api/charges?startzeit=${encodeURIComponent(startzeit)}&endzeit=${encodeURIComponent(endzeit)}`);
      const result = await response.json();

      if (!response.ok) {
        alert(result.error || 'Fehler beim Laden der Daten');
        return;
      }

      setFormData(prev => ({
        ...prev,
        chargenNr: result.chargenNr || '',
        lieferant: result.lieferant || '',
        sorte: result.sorte || '',
        anzahlBloeckeGut: result.anzahlBloeckeGut ?? '',
        anzahlBloeckeSchlecht: result.anzahlBloeckeSchlecht ?? '',
        anzahlBlocke: (Number(result.anzahlBloeckeGut) || 0) + (Number(result.anzahlBloeckeSchlecht) || 0),
      }));

    } catch (error) {
      alert('Verbindungsfehler zum Server beim Laden der Daten');
      console.error(error);
    } finally {
      setLoadingData(false);
    }
  };

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


  const fetchBlocks = async () => {
    if (!formData.chargenNr) {
      alert('Bitte wählen Sie zuerst eine ChargenNr aus!');
      return;
    }
    setLoadingBlocks(true);
    try {
      const resp = await fetch(`http://4.245.3.186:5000/:5000/api/blocks/${formData.chargenNr}`);
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
      pdf.setFontSize(14);
      pdf.setTextColor('#0d6efd');
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

        pdf.setFontSize(11);
        pdf.setTextColor('#0d6efd');
        pdf.setFont(undefined, 'bold');
        pdf.text(`${field.label} :`, leftMargin, y);


        pdf.setFontSize(11);
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

  // Nouvelle fonction pour gérer le clic sur le bouton de la ligne
  const handleBlockClick = (blockId) => {
    // Ici tu peux faire la redirection, par exemple :
    // window.location.href = `/blocks/${blockId}`;
    alert(`Bouton cliqué pour blockId: ${blockId}`);

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

                {/* Startzeit & Endzeit (à remplir manuellement) */}
                <div className="row mb-3">
                  <div className="col">
                    <label className="form-label fw-semibold">Startzeit</label>
                    <select
                      className="form-select"
                      value={formData.startzeit}
                      onChange={(e) => setFormData({ ...formData, startzeit: e.target.value })}
                    >
                      <option value="">Startzeit wählen</option>
                      {zeitPaare.map((zp, idx) => (
                        <option key={idx} value={zp.Startzeit}>
                          {new Date(zp.Startzeit).toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col">
                    <label className="form-label fw-semibold">Endzeit</label>
                    <select
                      className="form-select"
                      value={formData.endzeit}
                      onChange={(e) => setFormData({ ...formData, endzeit: e.target.value })}
                    >
                      <option value="">Endzeit wählen</option>
                      {zeitPaare.map((zp, idx) => (
                        <option key={idx} value={zp.Endzeit}>
                          {new Date(zp.Endzeit).toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>


                {/* ChargeID, Lieferant, Sorte */}
                <div className="row mb-3">
                  <div className="col">
                    <label className="form-label fw-semibold">ChargeID</label>
                    <input
                      type="text"
                      className="form-control"
                      name="chargenNr"
                      value={formData.chargenNr}
                      readOnly
                    />
                  </div>
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

                {/* Blöcke Gut, Schlecht, Gesamt */}
                <div className="row mb-3">
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
                  disabled={loadingData || !formData.startzeit || !formData.endzeit}
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
                  {loadingZogihortige ? 'Lädt...' : ' Daten Anzeigen'}
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
                          <th>ChargeNr</th>
                          <th>NummerPanter</th>
                          <th>Bezeichnung</th>

                          <th>Blöcke Gut</th>
                          <th>Blöcke Schlecht</th>
                          <th>Blöcke Gesamt</th>
                          <th>Lieferant</th>
                          <th>Sorte</th>
                          <th>Aktion</th>
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
                  {loadingBlocks ? 'Lädt...' : 'Zugehörige Blocke'}
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
                          <th>Details</th> {/* Colonne du bouton */}
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
                              <a
                                href={`/details/${blk.BlockID}`}
                                className="btn btn-success btn-sm"
                              >
                                Details
                              </a>
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
