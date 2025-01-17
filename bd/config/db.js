const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'user',
    password: 'pgr2025',
    database: 'automacao_csv'
});

db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        process.exit(1);
    } else {
        console.log('Conexão bd bem sucedida!');
    }
});

module.exports = db; 