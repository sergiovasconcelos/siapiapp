// index.js
const express = require('express');
const pool = require('./db');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

// auth middleware
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// LOGIN
app.post('/api/login', async (req, res) => {
  const { cpf, password } = req.body;
  if (!cpf || !password) return res.status(400).json({ error: 'Missing cpf or password' });
  try {
    const [rows] = await pool.query('SELECT * FROM professionals WHERE cpf = ?', [cpf]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Credenciais inválidas' });
    const token = jwt.sign({ cpf: user.cpf, name: user.name }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, cpf: user.cpf, name: user.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// GET children
app.get('/api/children', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nome, data_nascimento, cpf, tipo, logradouro, numero, localidade FROM children ORDER BY nome');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// START attendance (single)
app.post('/api/attendances/start', authMiddleware, async (req, res) => {
  const { child_id, started_lat, started_lng, started_at } = req.body;
  const professional_cpf = req.user.cpf;
  const startedAt = started_at ? new Date(started_at) : new Date();
  try {
    const [result] = await pool.query(
      `INSERT INTO attendances (child_id, professional_cpf, status, started_at, started_lat, started_lng)
       VALUES (?, ?, 'INICIADO', ?, ?, ?)`,
      [child_id, professional_cpf, startedAt, started_lat, started_lng]
    );
    res.json({ attendanceId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao iniciar atendimento' });
  }
});

// BULK sync endpoint for attendances + actions from client
// payload example:
// {
//   attendances: [{ tempId: -1, child_id, started_at, started_lat, started_lng, finished_at, finished_lat, finished_lng, status }],
//   actions: [{ tempId: -1, attendanceTempId: -1, descricao, created_at }]
// }
// returns mapping so client can replace temp ids with server ids
app.post('/api/sync', authMiddleware, async (req, res) => {
  const professional_cpf = req.user.cpf;
  const { attendances = [], actions = [] } = req.body;

  const mapping = { attendances: [], actions: [] };
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // insert attendances
    for (const a of attendances) {
      const startedAt = a.started_at ? new Date(a.started_at) : null;
      const finishedAt = a.finished_at ? new Date(a.finished_at) : null;
      const [result] = await conn.query(
        `INSERT INTO attendances (child_id, professional_cpf, status, started_at, started_lat, started_lng, finished_at, finished_lat, finished_lng)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [a.child_id, professional_cpf, a.status || 'INICIADO', startedAt, a.started_lat, a.started_lng, finishedAt, a.finished_lat, a.finished_lng]
      );
      mapping.attendances.push({ tempId: a.tempId, id: result.insertId });
    }

    // insert actions (we need to match attendanceTempId -> real id)
    for (const act of actions) {
      // find mapped attendance id
      const map = mapping.attendances.find(m => m.tempId === act.attendanceTempId);
      const attendanceId = map ? map.id : act.attendance_id; // fallback
      const [r] = await conn.query(
        'INSERT INTO attendance_actions (attendance_id, descricao) VALUES (?, ?)',
        [attendanceId, act.descricao]
      );
      mapping.actions.push({ tempId: act.tempId, id: r.insertId, attendanceId });
    }

    await conn.commit();
    res.json({ ok: true, mapping });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Erro na sincronização' });
  } finally {
    conn.release();
  }
});

// list attendances (optionally ?status=FINALIZADO)
app.get('/api/attendances', authMiddleware, async (req, res) => {
  const status = req.query.status;
  try {
    let sql = `SELECT a.id, a.child_id, c.nome as child_name, a.professional_cpf, a.status, a.started_at, a.started_lat, a.started_lng, a.finished_at, a.finished_lat, a.finished_lng
               FROM attendances a JOIN children c ON c.id = a.child_id`;
    const params = [];
    if (status) {
      sql += ' WHERE a.status = ?';
      params.push(status);
    }
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar atendimentos' });
  }
});

// actions endpoints
app.post('/api/attendances/:id/actions', authMiddleware, async (req, res) => {
  const attendance_id = req.params.id;
  const { descricao } = req.body;
  try {
    const [result] = await pool.query('INSERT INTO attendance_actions (attendance_id, descricao) VALUES (?, ?)', [attendance_id, descricao]);
    res.json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao gravar ação' });
  }
});

app.get('/api/attendances/:id/actions', authMiddleware, async (req, res) => {
  const attendance_id = req.params.id;
  try {
    const [rows] = await pool.query('SELECT id, descricao, created_at FROM attendance_actions WHERE attendance_id = ? ORDER BY created_at', [attendance_id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar ações' });
  }
});

app.put('/api/actions/:id', authMiddleware, async (req, res) => {
  const id = req.params.id;
  const { descricao } = req.body;
  try {
    await pool.query('UPDATE attendance_actions SET descricao = ? WHERE id = ?', [descricao, id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar' });
  }
});

app.delete('/api/actions/:id', authMiddleware, async (req, res) => {
  const id = req.params.id;
  try {
    await pool.query('DELETE FROM attendance_actions WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao deletar' });
  }
});

// finish attendance single (when online)
app.post('/api/attendances/:id/finish', authMiddleware, async (req, res) => {
  const id = req.params.id;
  const { finished_lat, finished_lng, finished_at } = req.body;
  const finishedAt = finished_at ? new Date(finished_at) : new Date();
  try {
    await pool.query(
      `UPDATE attendances SET status='FINALIZADO', finished_at=?, finished_lat=?, finished_lng=? WHERE id = ?`,
      [finishedAt, finished_lat, finished_lng, id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao finalizar' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`API rodando na porta ${PORT}`));
