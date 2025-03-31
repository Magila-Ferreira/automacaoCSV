import { escalas, fatores, questoes } from './insertsEstaticos.js';
import { gerenciadorDeConexoesBD } from '../config/configBanco.js';
import { filtrarRegistrosNovos, recuperarDadosDoBanco } from './consultasBanco.js';

const usuario = 'root'; // Usuário com permissões para criar banco e tabelas

const criarBanco = async (database) => {
	const conexoes = gerenciadorDeConexoesBD(null, usuario);
	
    try {
        // SQL
        const create_database = `CREATE DATABASE IF NOT EXISTS \`${database}\`
            CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`;        

        // Criar banco de dados
        await conexoes.query(create_database);
        console.log(`Banco criado ou existente BD: ${database}`);
    } catch (error) {
        console.error("Erro ao criar banco e/ou tabelas: ", error.message);
    } finally {
        conexoes.end();
    }
}
const definirTabelas = async (database, identificacaoCols) => {
    try {
        // Reutilizar a conexão para o banco criado
        const db = gerenciadorDeConexoesBD(database, usuario);

        // SQL
        const create_table_escala = `CREATE TABLE IF NOT EXISTS escala (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nome VARCHAR(255) NOT NULL);`; 

        const create_table_fator = `CREATE TABLE IF NOT EXISTS fator (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nome VARCHAR(150) NOT NULL,
            id_escala INT NOT NULL,
            FOREIGN KEY (id_escala) REFERENCES escala(id));`;
           
        const create_table_questao = `CREATE TABLE IF NOT EXISTS questao (
            id INT AUTO_INCREMENT PRIMARY KEY,
            afirmacao VARCHAR(255) NOT NULL,
            id_fator INT NOT NULL,
            FOREIGN KEY (id_fator) REFERENCES fator(id));`;
		
		const definirTipoColunaIdentificacao = (col) => { 
			const tipos = {
				setor: "VARCHAR(100) NOT NULL",
				cargo: "VARCHAR(100) NOT NULL",
				escolaridade: "VARCHAR(100) NOT NULL",
				estadoCivil: "VARCHAR(100) NOT NULL",
				genero: "VARCHAR(100) NOT NULL",
				idade: "INT NOT NULL",
			};
			return `\`${col}\` ${tipos[col] || "VARCHAR(100) NOT NULL"}`;
		};

		const create_table_identificacao = `CREATE TABLE IF NOT EXISTS identificacao (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ${identificacaoCols.map(definirTipoColunaIdentificacao).join(', ')},
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (setor, cargo, idade, escolaridade, estadoCivil, genero));`;

        const create_table_questao_resposta = `CREATE TABLE IF NOT EXISTS questao_resposta (
            id INT AUTO_INCREMENT PRIMARY KEY,
            id_identificacao INT NOT NULL,
            id_questao INT NOT NULL,
            resposta VARCHAR(50) NOT NULL,
            FOREIGN KEY (id_identificacao) REFERENCES identificacao(id),
            FOREIGN KEY (id_questao) REFERENCES questao(id));`;

        // Criar tabelas 
        await db.query(create_table_escala);
        await db.query(create_table_fator);
        await db.query(create_table_questao);
        await db.query(create_table_identificacao);
        await db.query(create_table_questao_resposta); 
        db.end();
        console.log(`Tabelas criadas ou existentes!`);
    } catch (error) {
        console.error("Erro ao criar Tabelas: ", error.message);
	}
};
const salvarDados = async (dados, database, colsResposta) => {
    const db = gerenciadorDeConexoesBD(database, usuario);
    try {
        // SQL --> INSERTS
        const insert_escala = `INSERT IGNORE INTO escala (nome) VALUES (?)`;
        const insert_fator = `INSERT IGNORE INTO fator (nome, id_escala) VALUES (?, ?)`;
        const insert_questao = `INSERT IGNORE INTO questao (afirmacao, id_fator) VALUES (?, ?)`;

        const insert_identificacao = `INSERT IGNORE INTO identificacao 
        (setor, cargo, idade, escolaridade, estadoCivil, genero) 
        VALUES (?, ?, ?, ?, ?, ?)`;      

        const insert_questao_resposta = `INSERT IGNORE INTO questao_resposta 
        (id_identificacao, id_questao, resposta) VALUES (?, ?, ?)`;    

        // Insere dados na tabela escala
        for (const escala of Object.values(escalas)) {
            const valores_escala = (escala.nome);
            await db.query(insert_escala, valores_escala);
        };
        // Insere dados na tabela fator
        for (const fator of Object.values(fatores)) {
            const valores_fator = [fator.nome, fator.id_escala];
            await db.query(insert_fator, valores_fator);
        };
        // Insere dados na tabela questao
        for (const questao of Object.values(questoes)) {
            const valores_questao = [questao.afirmacao, questao.id_fator];
            await db.query(insert_questao, valores_questao)
        };

        // Insere os dados na tabela identificação e questao_resposta
        for (const item of dados) {                     
            const valores_identificacao = [item.setor, item.cargo, parseInt(item.idade, 10), item.escolaridade, item.estadoCivil, item.genero];                
    
            // Insere na tabela 'identificação' caso não exista
            const [result] = await db.query(insert_identificacao, valores_identificacao);
            const id_identificacao = result.insertId || (rows.length > 0 ? rows[0].id : null);

            // VERIFICAÇÃO ADICIONAL:
            if (id_identificacao) {
                // Insere as respostas associadas ao id_identificacao
                for (let i = 0; i < colsResposta.length; i++) { // Itera sobre as colunas respostas
                    const resposta = item[colsResposta[i]]; // Obtém o valor com base no índice da coluna
                    const id_questao = i + 1; // Calcula o id da questão com base no índice da coluna

                    if (resposta) { // Garante que a resposta não é vazia
                        const valores_questao_resposta = [id_identificacao, id_questao, resposta];
                        // Insere na tabela 'questao_resposta' caso não exista
                        await db.query(insert_questao_resposta, valores_questao_resposta);
                    }
                }
            } 
        }         
        console.log(`Registros salvos com sucesso: ${database} \n`);
    } catch (error) {
        console.error(`Erro ao salvar dados. Banco: ${database}. Erro: ${error.message}`);
    } finally {
        db.end();
    }
};
const salvarRegistrosNoBanco = async (dadosTratados, databaseName, identificacaoCols, colsResposta) => {
    // Criar banco
    await criarBanco(databaseName);
	await definirTabelas(databaseName, identificacaoCols); 

    const dadosBanco = await recuperarDadosDoBanco(databaseName, usuario); // 1. Recupera os dados salvos no banco
    const novosRegistros = filtrarRegistrosNovos(dadosTratados, dadosBanco); // 2. Verifica se há registros nos arquivos diferentes dos registros do banco

    if (novosRegistros.length > 0) {
        await salvarDados(novosRegistros, databaseName, colsResposta); // 3. Salvando os novos registros
    } else {
        console.log(`Não há novos registros para salvar no banco: ${databaseName} \n`);
	}
	return novosRegistros.length > 0;
};
export { salvarRegistrosNoBanco };