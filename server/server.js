require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sql = require('mssql');

const app = express();
const PORT = process.env.PORT || 5000;

// Configuration de la base de données SQL Server
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: false,
    enableArithAbort: true
  }
};

app.use(cors());
app.use(express.json());

let pool;
async function getPool() {
  if (pool && pool.connected) return pool;
  if (pool) try { await pool.close(); } catch {}
  pool = await sql.connect(config);
  return pool;
}

app.get('/api/zeitpaare', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT DISTINCT Startzeit, Endzeit
      FROM FE_Charge
      
    `);

    console.log('zeitpaare:', result.recordset); 
    res.json(result.recordset);
  } catch (err) {
    console.error('SQL error:', err);
    res.status(500).json({ error: 'Fehler beim Abrufen der Zeitpaare' });
  }
});




app.get('/api/charges', async (req, res) => {
  const { startzeit, endzeit } = req.query;

  if (!startzeit || !endzeit) {
    return res.status(400).json({ error: 'Startzeit und Endzeit sind erforderlich' });
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('start', sql.DateTime, new Date(startzeit))
      .input('end', sql.DateTime, new Date(endzeit))
      .query(`
        SELECT TOP 1
          ChargeID,
          Sorte,
          Lieferant,
          AnzahlBloeckeGut,
          AnzahlBloeckeSchlecht,
          ISNULL(AnzahlBloeckeGut, 0) + ISNULL(AnzahlBloeckeSchlecht, 0) AS GesamtBlocke
        FROM FE_Charge
        WHERE Startzeit >= @start AND Endzeit <= @end
        ORDER BY Startzeit ASC
      `);

    const row = result.recordset[0];
    if (!row) {
      return res.status(404).json({ error: 'Keine Charge im Zeitraum gefunden' });
    }

    res.json({
      chargenNr: row.ChargeID,
      sorte: row.Sorte,
      lieferant: row.Lieferant,
      anzahlBloeckeGut: row.AnzahlBloeckeGut,
      anzahlBloeckeSchlecht: row.AnzahlBloeckeSchlecht
    });

  } catch (error) {
    console.error('SQL Fehler:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Daten' });
  }
});



// 🔹 Route: Variante EF de la charge
app.get('/api/efcharge/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.VarChar, id)
      .query('SELECT * FROM FE_Charge WHERE ChargeID = @id');

    const row = result.recordset[0];
    if (!row) return res.status(404).send('Not found');

    const anzahlBlocke = (row.AnzahlBloeckeGut || 0) + (row.AnzahlBloeckeSchlecht || 0);
    res.json({
      chargenNr: row.ChargeID,
      nummerPanter: row.NummerPanter,
      bezeichnung: row.Bezeichnung,
      startzeit: row.Startzeit,
      endzeit: row.Endzeit,
      anzahlBlocke,
      anzahlBloeckeGut: row.AnzahlBloeckeGut,
      anzahlBloeckeSchlecht: row.AnzahlBloeckeSchlecht,
      lieferant: row.Lieferant,
      sorte: row.Sorte
    });
  } catch (error) {
    console.error('SQL error:', error);
    res.status(500).send('Error retrieving data');
  }
});

// 🔹 Route: Obtenir les blocs d’une charge
app.get('/api/blocks/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.VarChar, id)
      .query(`
        SELECT BlockID, schlecht, Startzeit, Endzeit
        FROM FE_ViewBlock
        WHERE ChargeID = @id
      `);

    const rows = result.recordset;
    if (!rows || rows.length === 0) return res.status(404).send('Not found');

    res.json(rows);
  } catch (error) {
    console.error('SQL error:', error);
    res.status(500).send('Error retrieving blocks');
  }
});

// 🔸 Lancer le serveur sur toutes les interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server läuft auf Port ${PORT}`);
});