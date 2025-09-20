const bcrypt = require('bcryptjs');

const senha = 'single10'; // Substitua pela senha que quer salvar
const saltRounds = 10;

bcrypt.hash(senha, saltRounds, (err, hash) => {
  if (err) {
    console.error('Erro ao gerar hash:', err);
    return;
  }
  console.log('Senha hashada:', hash);
});
