const mysql = require('mysql2/promise');

const createConnection = async (database) => {
    return await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database,
        multipleStatements: true,
    });
};

module.exports = { createConnection }; 

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