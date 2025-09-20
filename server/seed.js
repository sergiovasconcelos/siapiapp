// seed.js
const pool = require('./db');
const bcrypt = require('bcrypt');

async function seed() {
  const password = 'senha123'; // troque
  const hash = await bcrypt.hash(password, 10);

  // criar profissional
  await pool.query('INSERT IGNORE INTO professionals (cpf, name, password_hash) VALUES (?, ?, ?)', ['00000000000', 'Teste Profissional', hash]);

  // criar algumas crianças
  const kids = [
    ['Maria Silva', '2018-05-10', '11111111111', 'CRIANCA', 'Rua A', '10', 'Bairro X'],
    ['João Souza', '2016-11-20', '22222222222', 'CRIANCA', 'Rua B', '20', 'Bairro Y'],
    ['Ana Pereira', '2019-01-05', '33333333333', 'CRIANCA', 'Av C', '300', 'Bairro Z'],
  ];

  for (const k of kids) {
    await pool.query('INSERT IGNORE INTO children (nome, data_nascimento, cpf, tipo, logradouro, numero, localidade) VALUES (?, ?, ?, ?, ?, ?, ?)', k);
  }

  console.log('Seed concluído.');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
