import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import pool from './db.js';

dotenv.config();

export async function login(req, res) {
  const { cpf, senha } = req.body;

  try {
    const [rows] = await pool.query(
      "SELECT * FROM profissionais WHERE cpf = ? AND senha = ?",
      [cpf, senha]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "CPF ou senha inválidos" });
    }

    const user = rows[0];
    const token = jwt.sign(
      { cpf: user.cpf, id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({ token, user });
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({ error: "Erro no servidor" });
  }
}

export function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: "Token não fornecido" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Token inválido" });
    req.user = decoded;
    next();
  });
}
