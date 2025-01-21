//const { resolve } = require('chart.js/helpers');
const { createConnection } = require('../config/db');

const criarBancoEDefinirTabelas = async (database, identificacaoCols, respostasCols) => {
    const connection = await createConnection(null);

    try {
        // SQL
        const create_database = `CREATE DATABASE IF NOT EXISTS \`${database}\`
            CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`;
        const create_table_identificacao = `CREATE TABLE IF NOT EXISTS 
            identificacao (id INT AUTO_INCREMENT PRIMARY KEY,
            ${identificacaoCols.map((col) => `\`${col}\` TEXT`).join(', ')});`;
        const create_table_respostas = `CREATE TABLE IF NOT EXISTS 
            respostas (id INT AUTO_INCREMENT PRIMARY KEY, id_identificacao INT, 
            ${respostasCols.map((col) => `\`${col}\` TEXT`).join(', ')}, 
            FOREIGN KEY (id_identificacao) REFERENCES identificacao(id));`;

        // Criar banco de dados
        await connection.query(create_database);

        // Reutilizar a conexão para o banco criado
        const db = await createConnection(database);
        
        // Criar tabelas `identificacao` e `respostas`
        await db.query(create_table_identificacao);
        await db.query(create_table_respostas); 
        
        console.log(`Banco "${database}" e Tabelas: identificacao e respostas, criadas ou já existentes.`);
        db.end();
    } catch (error) {
        console.error("Erro ao criar banco ou tabelas: ", error.message);
    } finally {
        connection.end();
    }
}

const salvarDadosCSV = async (dados, database) => {
    const connection = await createConnection(database);
    
    try {
        for (const item of dados) {

            // SQL --> IDENTIFICACAO 
            const select_identificacao = `
            SELECT id FROM identificacao
            WHERE setor = ? AND idade = ? AND escolaridade = ? AND estadoCivil = ? AND genero = ?`;

            const insert_identificacao = `
            INSERT INTO identificacao 
            (setor, cargo, idade, escolaridade, estadoCivil, genero) 
            VALUES (?, ?, ?, ?, ?, ?)`;           

            const valores_identificacao = [
                item.setor, 
                item.cargo, 
                parseInt(item.idade, 10), 
                item.escolaridade, 
                item.estadoCivil, 
                item.genero];

            // Verifica se um registro já existe na tabela 'identificacao'    
            const [identificacaoExistente] = await connection.query(select_identificacao, valores_identificacao);

            let id_identificacao; 
            if (identificacaoExistente.length > 0) {
                id_identificacao = identificacaoExistente[0].id;

            } else {
                
                // Insere na tabela 'identificação' caso não exista
                const [result] = await connection.query(insert_identificacao, valores_identificacao);
                id_identificacao = result.insertId;
            }
            
            const colunasRespostas = Object.keys(item).slice(6); // Obter o nome das colunas csv para a tabela respostas
            const respostas = Object.keys(item).filter((key, index) => index >= 6).map((key) => item[key]); // Obter os dados csv para a tabela 'respostas'
                        
            // SQL --> RESPOSTAS
            const insert_respostas = `
            INSERT INTO respostas 
            (id_identificacao, ${colunasRespostas.join(', ')}) VALUES (?, ${colunasRespostas.map(() => '?').join(', ')})`;

            const select_respostas = `
            SELECT id FROM respostas
            WHERE id_identificacao = ?`;

            // Verificar se os dados csv já estão na tabela respostas
            const [respostasExistentes] = await connection.query(select_respostas, [id_identificacao]);  
            
            // Inserir os dados na tabela respostas
            if (respostasExistentes.length === 0) {
                await connection.query(insert_respostas, [id_identificacao, ...respostas]); 
            }
        }
        console.log("Todos os dados foram salvos com sucesso no bd!");

    } catch (error) {
        console.error("Erro ao salvar os dados no banco: ", error.message);
        throw error;

    } finally {
        connection.end();
    }
};

module.exports = { criarBancoEDefinirTabelas, salvarDadosCSV };