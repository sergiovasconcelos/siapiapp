const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Banco de dados em memória (só para testes)
let atendimentos = [];

// ✅ Iniciar atendimento
app.post("/api/attendances/start", (req, res) => {
  const { childId } = req.body;

  if (!childId) {
    return res.status(400).json({ error: "childId é obrigatório" });
  }

  const novoAtendimento = {
    id: atendimentos.length + 1,
    childId,
    startTime: new Date(),
    status: "iniciado"
  };

  atendimentos.push(novoAtendimento);

  return res.status(201).json(novoAtendimento);
});

// ✅ Listar atendimentos (opcional para debug)
app.get("/api/attendances", (req, res) => {
  return res.json(atendimentos);
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
