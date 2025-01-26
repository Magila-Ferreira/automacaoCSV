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
