/* 4. Configurações do Banco de dados */
const mysql = require('mysql2/promise');
require('dotenv').config();

const gerenciadorDeConexoesBD = (database = null, usuario = 'root') => { 

    // Seleciona as credenciais com base no usuário
    const configUsuarios = {
        root: {
            host: process.env.DB_ROOT_HOST,
            user: process.env.DB_ROOT_USER,
            password: process.env.DB_ROOT_PASSWORD
        },
        adm: {
            host: process.env.DB_ADM_HOST,
            user: process.env.DB_ADM_USER,
            password: process.env.DB_ADM_PASSWORD
        },
        user: {
            host: process.env.DB_USER_HOST,
            user: process.env.DB_USER_USER,
            password: process.env.DB_USER_PASSWORD
        },
        readonly_user: {
            host: process.env.DB_READONLY_USER_HOST,
            user: process.env.DB_READONLY_USER_USER,
            password: process.env.DB_READONLY_USER_PASSWORD
        }
    };

    const credenciais = configUsuarios[usuario];

    return mysql.createPool({
        ...credenciais,
        database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    });
};

module.exports = { gerenciadorDeConexoesBD }; 

/* 
-- Permissões do usuário root
PERMISSÕES: TODAS.
    host: 'localhost',
    user: 'root',
    password: ''

-- Permissões do usuário ADM
PERMISSÕES: SELECT, INSERT, UPDATE, DELETE, ALTER, CREATE, DROP
    host: 'localhost',
    user: 'adm',
    password: 'pgr17012025'

-- Permissões do usuário USER
PERMISSÕES: SELECT, INSERT, UPDATE, DELETE
    host: 'localhost',
    user: 'user',
    password: 'pgr2025'

-- Permissões do usuário READONLY_USER
PERMISSÕES: SELECT
    host: 'localhost',
    user: 'readonly_user',
    password: 'pgr'
*/