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

// Route pour récupérer les blocs d'une charge (déjà existante)
app.get('/api/blocks/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.VarChar, id)
      .query(`
        SELECT BlockID, schlecht, Startzeit, Endzeit, link
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server läuft auf Port ${PORT}`);
});