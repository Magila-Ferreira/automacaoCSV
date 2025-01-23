//const { resolve } = require('chart.js/helpers');
const { createConnection } = require('../config/db');

const criarBancoEDefinirTabelas = async (database, identificacaoCols, respostasCols) => {
    const connection = await createConnection(null);

    try {
        // SQL
        const create_database = `CREATE DATABASE IF NOT EXISTS \`${database}\`
            CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`;        

        // Criar banco de dados
        await connection.query(create_database);
        connection.end();

        // Reutilizar a conexão para o banco criado
        const db = await createConnection(database);

        // SQL
        const create_table_identificacao = `CREATE TABLE IF NOT EXISTS identificacao (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ${identificacaoCols.map((col) => {
                // Define o tipo de dados e atributos para cada coluna
                switch (col) {
                    case 'setor':
                    case 'cargo':
                    case 'escolaridade':
                    case 'estadoCivil':
                    case 'genero':
                        return `\`${col}\` VARCHAR(100) NOT NULL`;
                    case 'idade':
                        return `\`${col}\` INT NOT NULL`;
                    
                    default:
                        return `\`${col}\` TEXT NOT NULL`; // Define o tipo de dados padrão    
                }
            }).join(', ')},
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`;

        const create_table_respostas = `CREATE TABLE IF NOT EXISTS respostas (
            id INT AUTO_INCREMENT PRIMARY KEY, id_identificacao INT NOT NULL, 
            ${respostasCols.map((col) => `\`${col}\` VARCHAR(20) NOT NULL`).join(', ')}, 
            FOREIGN KEY (id_identificacao) REFERENCES identificacao(id));`;

        // Criar tabelas `identificacao` e `respostas`
        await db.query(create_table_identificacao);
        await db.query(create_table_respostas); 
        
        console.log(`\n Banco "${database}" e Tabelas criadas.`);
        db.end();
    } catch (error) {
        console.error("\n Erro ao criar banco ou tabelas: ", error.message);
    } 
}

const salvarDados = async (dados, database) => {
    const db = await createConnection(database);
    
    try {
        for (const item of dados) {

            // SQL --> IDENTIFICACAO 
            const select_identificacao = `
            SELECT id FROM identificacao
            WHERE setor = ? AND cargo = ? AND idade = ? AND escolaridade = ? AND estadoCivil = ? AND genero = ?`;

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
            const [identificacaoExistente] = await db.query(select_identificacao, valores_identificacao);

            let id_identificacao; 
            if (identificacaoExistente.length > 0) {
                id_identificacao = identificacaoExistente[0].id;

            } else {
                
                // Insere na tabela 'identificação' caso não exista
                const [result] = await db.query(insert_identificacao, valores_identificacao);
                id_identificacao = result.insertId;
            }
            
            const colunasRespostas = Object.keys(item).slice(6); // Obter o nome das colunas do arquivo para a tabela respostas
            const respostas = Object.keys(item).filter((key, index) => index >= 6).map((key) => item[key]); // Obter os dados do arquivo para a tabela 'respostas'
                        
            // SQL --> RESPOSTAS
            const insert_respostas = `
            INSERT INTO respostas 
            (id_identificacao, ${colunasRespostas.join(', ')}) VALUES (?, ${colunasRespostas.map(() => '?').join(', ')})`;

            const select_respostas = `
            SELECT id FROM respostas
            WHERE id_identificacao = ?`;

            // Verificar se os dados do arquivo já estão na tabela respostas
            const [respostasExistentes] = await db.query(select_respostas, [id_identificacao]);  
            
            // Inserir os dados na tabela respostas
            if (respostasExistentes.length === 0) {
                await db.query(insert_respostas, [id_identificacao, ...respostas]); 
            }
        }
        return;

    } catch (err) {
        console.error(`\n Erro ao salvar os dados no banco: ${database}`, err);
        throw err;

    } finally {
        db.end();
    }
};

// Recupera os registros do banco
const recuperarDadosDoBanco = async (database) => {
    const db = await createConnection(database);

    try {
        const select_dados_identificacao = `
            SELECT setor, cargo, idade, escolaridade, estadoCivil, genero 
            FROM identificacao`;

        const [rows] = await db.query(select_dados_identificacao);       

        if (!rows || rows.length === 0) {
            console.warn("\n Banco de dados VAZIO!");
            return [];
        }
        
        return rows.map(row => ({
            setor: row.setor?.trim(),
            cargo: row.cargo?.trim(),
            idade: parseInt(row.idade, 10),
            escolaridade: row.escolaridade?.trim(),
            estadoCivil: row.estadoCivil?.trim(),
            genero: row.genero?.trim(),           
        }));

    } catch (err) {
        console.error("\n Erro ao recuperar os dados do banco: ", err);
        throw err;
    } finally {
        db.end();
    }
}

module.exports = { criarBancoEDefinirTabelas, salvarDados, recuperarDadosDoBanco };