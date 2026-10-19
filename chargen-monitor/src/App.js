import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import 'bootstrap-icons/font/bootstrap-icons.css';

function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return '-';
  const cleaned = dateTimeStr.replace('Z', '').split('.')[0];
  return cleaned.replace('T', ' ');
}

// Tout le style est ici, directement dans le fichier.
// Rien à installer, pas de fichier .css séparé, police par défaut du système.
const styles = `
:root {
  --brand: #3b7695;
  --brand-dark: #2c5a72;
  --brand-bg: #eaf1f4;
  --bg: #f4f6f8;
  --surface: #ffffff;
  --border: #e0e4e8;
  --border-strong: #c9cfd6;
  --text-primary: #1a2226;
  --text-secondary: #55626b;
  --text-muted: #8a949c;
  --success: #2e7d32;
  --success-bg: #e8f5e9;
  --danger: #c62828;
  --danger-bg: #fdecea;
  --warning: #b26a00;
  --warning-bg: #fff4e0;
  --shadow: 0 1px 2px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.05);
}

.monitor * { box-sizing: border-box; }

.monitor {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  padding: 2rem 1.5rem 4rem;
}

.monitor-shell { max-width: 1080px; margin: 0 auto; }

.monitor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--surface);
  border-radius: 12px;
  box-shadow: var(--shadow);
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
}

.monitor-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.monitor-logo {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: var(--brand);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.monitor-eyebrow {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--brand);
  text-transform: uppercase;
  margin: 0 0 2px;
}

.monitor-title {
  font-weight: 600;
  font-size: 20px;
  margin: 0;
  color: var(--text-primary);
}

.monitor-sub {
  font-size: 13px;
  color: var(--text-secondary);
  text-align: right;
}

.panel {
  background: var(--surface);
  border-radius: 12px;
  box-shadow: var(--shadow);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.panel-label {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--brand-dark);
  margin: 0 0 1.1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-label i { font-size: 15px; }

.field-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.field-row:last-child { margin-bottom: 0; }

.field { display: flex; flex-direction: column; gap: 6px; }

.field-label { font-size: 12.5px; color: var(--text-secondary); font-weight: 600; }

.field input {
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  padding: 10px 12px;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  width: 100%;
}

.field input:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px var(--brand-bg);
}

.field input[readonly] {
  background: #fafbfc;
  color: var(--text-primary);
  cursor: default;
}

.field-search { flex-direction: row; align-items: flex-end; gap: 12px; }
.field-search .field { flex: 1; }

.btn-ind {
  font-weight: 600;
  font-size: 14px;
  border: 1px solid var(--brand);
  background: var(--surface);
  color: var(--brand-dark);
  border-radius: 8px;
  padding: 10px 18px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background 0.15s ease, box-shadow 0.15s ease;
  white-space: nowrap;
}

.btn-ind:hover:not(:disabled) { background: var(--brand-bg); }
.btn-ind:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-ind-solid {
  background: var(--brand);
  color: #ffffff;
  border-color: var(--brand);
}

.btn-ind-solid:hover:not(:disabled) { background: var(--brand-dark); border-color: var(--brand-dark); }

.action-row { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 0.5rem; }
.action-row .btn-ind { flex: 1; justify-content: center; min-width: 180px; }

.readout-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.readout {
  background: var(--surface);
  border-radius: 12px;
  box-shadow: var(--shadow);
  padding: 1.1rem 1.25rem;
  border-left: 4px solid var(--border);
}

.readout.ok { border-left-color: var(--success); }
.readout.bad { border-left-color: var(--danger); }
.readout.accent { border-left-color: var(--brand); }

.readout-value { font-size: 26px; font-weight: 700; color: var(--text-primary); }
.readout-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-top: 4px;
}

.data-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }

.data-table th {
  text-align: left;
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--text-secondary);
  padding: 12px;
  border-bottom: 2px solid var(--border);
  background: #fafbfc;
}

.data-table td {
  padding: 11px 12px;
  border-bottom: 1px solid var(--border);
  color: var(--text-primary);
}

.data-table tr.row-bad { background: var(--danger-bg); }
.data-table tbody tr:hover { background: var(--brand-bg); }

.status-chip {
  font-size: 11.5px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.status-chip.ok { background: var(--success-bg); color: var(--success); }
.status-chip.bad { background: var(--danger-bg); color: var(--danger); }

.btn-detail {
  font-size: 12.5px;
  font-weight: 600;
  background: var(--surface);
  border: 1px solid var(--border-strong);
  color: var(--brand-dark);
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-detail:hover { background: var(--brand-bg); border-color: var(--brand); }

.monitor-alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 1.5rem;
  box-shadow: var(--shadow);
}

.monitor-alert.success { background: var(--success-bg); color: var(--success); }
.monitor-alert.warning { background: var(--warning-bg); color: var(--warning); }
.monitor-alert.danger { background: var(--danger-bg); color: var(--danger); }

.monitor-alert button {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 15px;
  opacity: 0.6;
}

.monitor-alert button:hover { opacity: 1; }

.footer-brand {
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
  margin-top: 2.5rem;
  letter-spacing: 0.02em;
}

@media (max-width: 640px) {
  .action-row .btn-ind { min-width: 100%; }
  .monitor-header { flex-direction: column; align-items: flex-start; gap: 10px; }
  .monitor-sub { text-align: left; }
}
`;

function App() {
  const [formData, setFormData] = useState({
    chargenNr: '',
    bezeichnung: '',
    startzeit: '',
    endzeit: '',
    anzahlBloeckeGut: '',
    anzahlBloeckeSchlecht: '',
    anzahlBlocke: '',
    lieferant: '',
    sorte: ''
  });

  const [loadingData, setLoadingData] = useState(false);
  const [blocks, setBlocks] = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [paletten, setPaletten] = useState([]);
  const [loadingPaletten, setLoadingPaletten] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const showNotification = (message, type = 'danger') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 8000);
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
      const response = await fetch(`http://185.80.92.91:5004/api/efcharge/${formData.chargenNr}`);
      if (!response.ok) {
        throw new Error('Charge nicht gefunden');
      }
      const data = await response.json();

      setFormData(prev => ({
        ...prev,
        chargenNr: data.chargenNr,
        bezeichnung: data.bezeichnung,
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
      const resp = await fetch(`http://185.80.92.91:5004/api/blocks/${formData.chargenNr}`);
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

  const fetchPaletten = async () => {
    if (!formData.chargenNr) {
      showNotification('Bitte geben Sie eine ChargeID ein!', 'warning');
      return;
    }
    setLoadingPaletten(true);
    try {
      const resp = await fetch(`http://185.80.92.91:5004/api/paletten/${formData.chargenNr}`);
      let body = null;
      try {
        body = await resp.json();
      } catch (parseErr) {
        // réponse non JSON
      }

      if (!resp.ok) {
        const detail = body && (body.details || body.error);
        throw new Error(detail || `Fehler beim Laden der Paletten (Status ${resp.status})`);
      }

      setPaletten(body);
      showNotification('Paletten erfolgreich geladen!', 'success');
    } catch (e) {
      showNotification(`Fehler beim Laden der Paletten: ${e.message}`, 'danger');
      console.error('Paletten-Fehler:', e);
    } finally {
      setLoadingPaletten(false);
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
    printField('Bezeichnung', formData.bezeichnung);
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

  const alertIcon = {
    success: 'bi-check-circle-fill',
    warning: 'bi-exclamation-triangle-fill',
    danger: 'bi-exclamation-octagon-fill'
  };

  return (
    <div className="monitor">
      {/* Le style est injecté ici, pas besoin de fichier .css séparé ni d'installation */}
      <style>{styles}</style>

      <div className="monitor-shell">
        <div className="monitor-header">
          <div className="monitor-header-left">
            <div className="monitor-logo"><i className="bi bi-gear-fill"></i></div>
            <div>
              <p className="monitor-eyebrow">MRS Metall Recycling Service Willich</p>
              <h1 className="monitor-title">Chargen Monitor</h1>
            </div>
          </div>
          <div className="monitor-sub">
            {new Date().toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })}
          </div>
        </div>

        {notification.show && (
          <div className={`monitor-alert ${notification.type}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className={`bi ${alertIcon[notification.type] || alertIcon.danger}`}></i>
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification({ show: false, message: '', type: '' })}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        )}

        <div className="panel">
          <p className="panel-label"><i className="bi bi-search"></i>Charge abrufen</p>
          <div className="field-row field-search">
            <div className="field">
              <label className="field-label">Buchungsnummer</label>
              <input
                type="text"
                name="chargenNr"
                value={formData.chargenNr}
                onChange={handleChange}
                placeholder="z. B. 53603"
              />
            </div>
            <button className="btn-ind btn-ind-solid" onClick={loadChargeData} disabled={loadingData}>
              <i className="bi bi-search"></i>
              {loadingData ? 'Lädt...' : 'Daten laden'}
            </button>
          </div>

          <div className="field-row">
            <div className="field">
              <label className="field-label">Bezeichnung</label>
              <input type="text" value={formData.bezeichnung} readOnly />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label className="field-label">Startzeit</label>
              <input type="text" value={formatDateTime(formData.startzeit)} readOnly />
            </div>
            <div className="field">
              <label className="field-label">Endzeit</label>
              <input type="text" value={formatDateTime(formData.endzeit)} readOnly />
            </div>
            <div className="field">
              <label className="field-label">Lieferant</label>
              <input type="text" value={formData.lieferant} readOnly />
            </div>
            <div className="field">
              <label className="field-label">Sorte</label>
              <input type="text" value={formData.sorte} readOnly />
            </div>
          </div>
        </div>

        <div className="readout-row">
          <div className="readout ok">
            <div className="readout-value">{formData.anzahlBloeckeGut || '0'}</div>
            <div className="readout-label">Pakete ohne Befund</div>
          </div>
          <div className="readout bad">
            <div className="readout-value">{formData.anzahlBloeckeSchlecht || '0'}</div>
            <div className="readout-label">Pakete mit Fe</div>
          </div>
          <div className="readout accent">
            <div className="readout-value">{formData.anzahlBlocke || '0'}</div>
            <div className="readout-label">Pakete gesamt</div>
          </div>
        </div>

        <div className="action-row">
          <button className="btn-ind" onClick={generatePDF} disabled={!formData.chargenNr}>
            <i className="bi bi-file-earmark-pdf"></i>
            PDF herunterladen
          </button>
          <button className="btn-ind" onClick={fetchPaletten} disabled={loadingPaletten || !formData.chargenNr}>
            <i className="bi bi-eye"></i>
            {loadingPaletten ? 'Lädt...' : 'Paletten anzeigen'}
          </button>
          <button className="btn-ind" onClick={fetchBlocks} disabled={loadingBlocks || !formData.chargenNr}>
            <i className="bi bi-box-seam"></i>
            {loadingBlocks ? 'Lädt...' : 'Blöcke anzeigen'}
          </button>
        </div>

        {paletten.length > 0 && (
          <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
            <p className="panel-label" style={{ padding: '1.25rem 1.25rem 0' }}>
              <i className="bi bi-pallet"></i>Paletten — Charge {formData.chargenNr}
            </p>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Beginn</th>
                  <th>PalettenLog</th>
                  <th>Lagerpalette</th>
                  <th>Status</th>
                  <th>Palettiert</th>
                  <th>Gepresst</th>
                  <th>Kontrolliert</th>
                </tr>
              </thead>
              <tbody>
                {paletten.map((p, idx) => (
                  <tr key={p.PalettenLog ?? idx} className={p.ErrorFlag ? 'row-bad' : ''}>
                    <td>{formatDateTime(p.Beginn)}</td>
                    <td>{p.PalettenLog ?? '-'}</td>
                    <td>{p.Lagerpalette ?? '-'}</td>
                    <td>
                      <span className={`status-chip ${p.ErrorFlag ? 'bad' : 'ok'}`}>
                        {p.ErrorFlag ? 'Fehler' : 'OK'}
                      </span>
                    </td>
                    <td>{p.Mitarbeiter_palettiert ?? '-'}</td>
                    <td>{p.Mitarbeiter_gepresst ?? '-'}</td>
                    <td>{p.Mitarbeiter_kontrolliert ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {blocks.length > 0 && (
          <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
            <p className="panel-label" style={{ padding: '1.25rem 1.25rem 0' }}>
              <i className="bi bi-box-seam"></i>Blöcke — Charge {formData.chargenNr}
            </p>
            <table className="data-table">
              <thead>
                <tr>
                  <th>BlockID</th>
                  <th>Status</th>
                  <th>Startzeit</th>
                  <th>Endzeit</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {blocks.map((blk) => (
                  <tr key={blk.BlockID} className={blk.schlecht === 1 ? 'row-bad' : ''}>
                    <td>{blk.BlockID}</td>
                    <td>
                      <span className={`status-chip ${blk.schlecht === 1 ? 'bad' : 'ok'}`}>
                        {blk.schlecht === 1 ? 'Defekt' : 'OK'}
                      </span>
                    </td>
                    <td>{formatDateTime(blk.Startzeit)}</td>
                    <td>{formatDateTime(blk.Endzeit)}</td>
                    <td>
                      <button className="btn-detail" onClick={() => handleBlockClick(blk)}>
                        <i className="bi bi-gear"></i>
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="footer-brand">MRS METALL RECYCLING SERVICE WILLICH GMBH &amp; CO. KG</p>
      </div>
    </div>
  );
}

export default App;