import express from 'express';
import { authMiddleware, login } from './auth.js';
import pool from './db.js';

const router = express.Router();

// Login
router.post('/login', login);

// Listar crianças
router.get('/criancas', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM criancas");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar crianças" });
  }
});

// Iniciar atendimento
router.post('/atendimentos/start', authMiddleware, async (req, res) => {
  const { child_id, started_lat, started_lng } = req.body;
  try {
    await pool.query(
      "INSERT INTO atendimentos (child_id, profissional_cpf, status, started_at, started_lat, started_lng) VALUES (?, ?, 'INICIADO', NOW(), ?, ?)",
      [child_id, req.user.cpf, started_lat, started_lng]
    );
    res.json({ message: "Atendimento iniciado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao iniciar atendimento" });
  }
});

// Finalizar atendimento
router.post('/atendimentos/finish', authMiddleware, async (req, res) => {
  const { atendimento_id, finished_lat, finished_lng } = req.body;
  try {
    await pool.query(
      "UPDATE atendimentos SET status='FINALIZADO', finished_at=NOW(), finished_lat=?, finished_lng=? WHERE id=?",
      [finished_lat, finished_lng, atendimento_id]
    );
    res.json({ message: "Atendimento finalizado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao finalizar atendimento" });
  }
});

// Ações realizadas (CRUD básico)
router.post('/acoes', authMiddleware, async (req, res) => {
  const { atendimento_id, descricao } = req.body;
  try {
    await pool.query(
      "INSERT INTO acoes (atendimento_id, descricao) VALUES (?, ?)",
      [atendimento_id, descricao]
    );
    res.json({ message: "Ação registrada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao registrar ação" });
  }
});

export default router;
