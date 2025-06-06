import { escalas, fatores, questoes } from '../conteudoEstatico/insertsEstaticos.js';
import { gerenciadorDeConexoesBD } from '../config/configBanco.js';
import { filtrarRegistrosNovos, filtrarRegistrosGerenciaisNovos, filtrarRegistrosGerenciaisNovosSetor, recuperarDadosDoBanco, recuperarDadosGerenciaisDoSetor, recuperarDadosGerenciaisDaEmpresa } from './consultasBanco.js';
import { normalizarTexto } from '../normatizacao/dadosGerenciais.js';

import { NOME_BANCO_CONTROLE } from '../config/configBanco.js';
import { USUARIO_BD } from '../config/configBanco.js';

const criarBancoETabelaDeControle = async () => {
	const criar_banco_controle = `CREATE DATABASE IF NOT EXISTS \`${NOME_BANCO_CONTROLE}\`
    	CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`;
	const usar_banco = `USE \`${NOME_BANCO_CONTROLE}\`;`;
	const criar_tabela_controle = `CREATE TABLE IF NOT EXISTS bancos (
		nome_banco VARCHAR(100) PRIMARY KEY,
		data_criacao DATE NOT NULL);`;

	const db = gerenciadorDeConexoesBD(null, USUARIO_BD);
	try {
		await db.query(criar_banco_controle);
		await db.query(usar_banco);
		await db.query(criar_tabela_controle);
		console.log(`Banco e Tabela de controle existentes!`);
	} catch (error) {
		console.error("Erro ao criar o banco controle_bancos: ", error.message);
	} finally {
		db.end();
	}

};
const criarBanco = async (nomeDoBanco) => {
	// SQL
	const criar_banco = `CREATE DATABASE IF NOT EXISTS \`${nomeDoBanco}\`
    	CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`;
	const usar_banco = `USE \`${NOME_BANCO_CONTROLE}\`;`;
	const registrar_controle_bancos = `INSERT IGNORE INTO bancos (nome_banco, data_criacao) VALUES (?, ?)`;
	const data = new Date().toISOString().split('T')[0]; 

	const db = gerenciadorDeConexoesBD(null, USUARIO_BD);
	try {
		await db.query(criar_banco); 
		await db.query(usar_banco);
		await db.query(registrar_controle_bancos, [nomeDoBanco, data]);
		console.log(`Banco ${nomeDoBanco} criado e inserido em ${NOME_BANCO_CONTROLE}!`);
	} catch (error) {
		console.error("Erro ao criar o banco: ", error.message);
	} finally {
		db.end();
	}
}
const definirTabelas = async (nomeDoBanco, identificacaoCols) => {
	// SQL
	const criar_tabela_escala = `CREATE TABLE IF NOT EXISTS escala (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL);`;

	const criar_tabela_fator = `CREATE TABLE IF NOT EXISTS fator (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(150) NOT NULL,
        id_escala INT NOT NULL,
        FOREIGN KEY (id_escala) REFERENCES escala(id));`;

	const criar_tabela_questao = `CREATE TABLE IF NOT EXISTS questao (
        id INT AUTO_INCREMENT PRIMARY KEY,
        afirmacao VARCHAR(255) NOT NULL,
        id_fator INT NOT NULL,
        FOREIGN KEY (id_fator) REFERENCES fator(id));`;

	const definirTipoColunaIdentificacao = (col) => {
		const tipos = {
			id: "INT PRIMARY KEY",
			setor: "VARCHAR(100) NOT NULL",
			cargo: "VARCHAR(100) NOT NULL",
			escolaridade: "VARCHAR(100) NOT NULL",
			estadoCivil: "VARCHAR(100) NOT NULL",
			genero: "VARCHAR(100) NOT NULL",
			idade: "INT NOT NULL",
		};
		return `\`${col}\` ${tipos[col] || "VARCHAR(100) NOT NULL"}`;
	};

	const criar_tabela_identificacao = `CREATE TABLE IF NOT EXISTS identificacao (
        ${identificacaoCols.map(definirTipoColunaIdentificacao).join(', ')},
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`;

	const criar_tabela_questao_resposta = `CREATE TABLE IF NOT EXISTS questao_resposta (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_identificacao INT NOT NULL,
        id_questao INT NOT NULL,
        resposta VARCHAR(50) NOT NULL,
		UNIQUE (id_identificacao, id_questao),
        FOREIGN KEY (id_identificacao) REFERENCES identificacao(id),
        FOREIGN KEY (id_questao) REFERENCES questao(id));`;
	
	const criar_tabela_risco_fator = `CREATE TABLE IF NOT EXISTS risco_fator (
		id INT AUTO_INCREMENT PRIMARY KEY,
		porcentagem_risco FLOAT NOT NULL,
		id_fator INT NOT NULL,
		FOREIGN KEY (id_fator) REFERENCES fator(id));`;
	
	const criar_tabela_risco_setor_fator = `CREATE TABLE IF NOT EXISTS risco_setor_fator (
		id INT AUTO_INCREMENT PRIMARY KEY,
		porcentagem_risco FLOAT NOT NULL,
		setor VARCHAR(100) NOT NULL,
		id_fator INT NOT NULL,
		FOREIGN KEY (id_fator) REFERENCES fator(id));`;

	const db = gerenciadorDeConexoesBD(nomeDoBanco, USUARIO_BD); // Reutiliza a conexão com o banco
	try {
		// Criar tabelas 
		await db.query(criar_tabela_escala);
		await db.query(criar_tabela_fator);
		await db.query(criar_tabela_questao);
		await db.query(criar_tabela_identificacao);
		await db.query(criar_tabela_questao_resposta);
		await db.query(criar_tabela_risco_fator);
		await db.query(criar_tabela_risco_setor_fator);
		db.end();
		console.log(`Tabelas criadas ou já existentes: ${nomeDoBanco}`);
	} catch (error) {
		console.error("Erro ao criar Tabelas: ", error.message);
	}
};
const salvarDados = async (dados, nomeDoBanco, colunasDasRespostasExcel) => {
	// SQL --> INSERTS
	const inserir_escala = `INSERT IGNORE INTO escala (nome) VALUES (?)`;
	const inserir_fator = `INSERT IGNORE INTO fator (nome, id_escala) VALUES (?, ?)`;
	const inserir_questao = `INSERT IGNORE INTO questao (afirmacao, id_fator) VALUES (?, ?)`;

	const inserir_identificacao = `INSERT IGNORE INTO identificacao 
        (id, setor, cargo, idade, escolaridade, estadoCivil, genero) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`;
	
	const inserir_questao_resposta = `INSERT IGNORE INTO questao_resposta 
        (id_identificacao, id_questao, resposta) VALUES (?, ?, ?)`;
	
	const db = gerenciadorDeConexoesBD(nomeDoBanco, USUARIO_BD);

	try {
		// Insere dados na tabela escala
		for (const escala of Object.values(escalas)) {
			const valores_escala = (escala.nome);
			await db.query(inserir_escala, valores_escala);
		};
		// Insere dados na tabela fator
		for (const fator of Object.values(fatores)) {
			const valores_fator = [fator.nome, fator.id_escala];
			await db.query(inserir_fator, valores_fator);
		};
		// Insere dados na tabela questao
		for (const questao of Object.values(questoes)) {
			const valores_questao = [questao.afirmacao, questao.id_fator];
			await db.query(inserir_questao, valores_questao)
		};

		// Insere os dados na tabela identificação e questao_resposta
		for (const item of dados) {
			const valores_identificacao = [parseInt(item.id, 10), normalizarTexto(item.setor), item.cargo, parseInt(item.idade, 10), item.escolaridade, item.estadoCivil, item.genero];

			// Insere na tabela 'identificação' caso não exista
			const [result] = await db.query(inserir_identificacao, valores_identificacao);
			const id_identificacao = parseInt(item.id, 10); // Usa o id original do item

			if (id_identificacao) {

				// Insere as respostas associadas ao id_identificacao
				for (let i = 0; i < colunasDasRespostasExcel.length; i++) { // Itera sobre as colunas respostas
					const resposta = item[colunasDasRespostasExcel[i]]; // Obtém a resposta da questao (com base no índice da coluna)
					const id_questao = i + 1; // Calcula o id da questão com base no índice da coluna
					
					if (resposta) { // Garante que a resposta não é vazia
						const valores_questao_resposta = [id_identificacao, id_questao, resposta];

						// Insere na tabela 'questao_resposta' caso não exista
						await db.query(inserir_questao_resposta, valores_questao_resposta);
					}
				}
			}
		}
		console.log(`Registros salvos com sucesso: ${nomeDoBanco} \n`);
	} catch (error) {
		console.error(`Erro ao salvar dados. Banco: ${nomeDoBanco}. Erro: ${error.message}`);
	} finally {
		db.end();
	}
};
const salvarRegistrosNoBanco = async (dadosTratados, nomeDoBanco, identificacaoCols, colunasDasRespostasExcel) => {
	// Criar banco
	await criarBancoETabelaDeControle(); // Cria banco e tabela de controle, se não existir
	await criarBanco(nomeDoBanco);
	await definirTabelas(nomeDoBanco, identificacaoCols);

	const dadosBanco = await recuperarDadosDoBanco(nomeDoBanco, USUARIO_BD); // 1. Recupera os dados salvos no banco
	const novosRegistros = filtrarRegistrosNovos(dadosTratados, dadosBanco); // 2. Compara os dados do arquivo com o banco

	if (novosRegistros.length > 0) {
		await salvarDados(novosRegistros, nomeDoBanco, colunasDasRespostasExcel); // 3. Salvando os novos registros
	} else {
		console.log(`\nNão há novos registros OPERACIONAIS para salvar no banco: ${nomeDoBanco}`);
	}
	return novosRegistros.length > 0;
};
async function limparBancosAntigos() {
	const seleciona_banco_antigo = `SELECT nome_banco, data_criacao FROM bancos`;
	const deletar_banco_controle = `DELETE FROM bancos WHERE nome_banco = ?`;

	const DIA_MS = 86400000;
	const hoje = new Date();

	const db = gerenciadorDeConexoesBD(NOME_BANCO_CONTROLE, USUARIO_BD);
	const [bancos] = await db.query(seleciona_banco_antigo);

	for (const { nome_banco, data_criacao } of bancos) { 
		const idadeBanco = Math.floor(hoje - new Date(data_criacao)) / DIA_MS;

		if (idadeBanco > 365) {
			const destruir_banco = `DROP DATABASE IF EXISTS \`${nome_banco}\``;
			try {
				await db.query(destruir_banco);
				await db.query(deletar_banco_controle, [nome_banco]);
				console.log(`✅ Banco ${nome_banco} removido (${idadeBanco.toFixed(0)} dias).`);
			} catch (error) {
				console.error(`❌ Erro ao remover ${nome_banco}:`, error.message);
			} 
		};
	};
	await db.end();
};

// ------------------------------------------ Gerencial
const salvarDadosGerenciais = async (dados, nomeDoBanco, instrucao_sql) => {
	const db = gerenciadorDeConexoesBD(nomeDoBanco, USUARIO_BD);

	try {
		for (const item of dados) {
			const valores = [item.porcentagem_risco, item.id_fator];
			await db.query(instrucao_sql, valores);
		}
	} catch (error) {
		console.error(`Erro ao salvar dados. Banco: ${nomeDoBanco}. Erro: ${error.message}`);
	} finally {
		db.end();
	}
};
const salvarDadosGerenciaisSetor = async (dados, nomeDoBanco, instrucao_sql) => {
	const db = gerenciadorDeConexoesBD(nomeDoBanco, USUARIO_BD);
	try {
		for (const item of dados) {
			const valores = [item.porcentagem_risco, normalizarTexto(item.setor), item.fator];
			await db.query(instrucao_sql, valores);
		}
	} catch (error) {
		console.error(`Erro ao salvar dados. Banco: ${nomeDoBanco}. Erro: ${error.message}`);
	} finally {
		db.end();
	}
};
const atualizarDadosGerenciais = async (dados, nomeDoBanco, instrucao_sql) => {
	const db = gerenciadorDeConexoesBD(nomeDoBanco, USUARIO_BD);

	try {
		for (const item of dados) {
			const valores = [item.porcentagem_risco, item.id_fator];
			await db.query(instrucao_sql, valores);
			console.log(`Atualizado: Fator ${item.id_fator} => ${item.porcentagem_risco}`);
		}
	} catch (error) {
		console.error(`Erro ao atualizar dados. Banco: ${nomeDoBanco}. Erro: ${error.message}`);
	} finally {
		db.end();
	}
}; 
const atualizarDadosGerenciaisSetor = async (dados, nomeDoBanco, instrucao_sql) => {
	const db = gerenciadorDeConexoesBD(nomeDoBanco, USUARIO_BD);

	try {
		for (const valores of dados) {
			// valores = [porcentagem_risco, setor, fator]
			const [porcentagem_risco, setor, fator] = valores;

			if (
				typeof fator === 'number' &&
				typeof setor === 'string' &&
				typeof porcentagem_risco === 'number'
			) {
				await db.query(instrucao_sql, valores);
				console.log(`Atualizado: Setor: ${setor}, Fator: ${fator}, Risco: ${porcentagem_risco}`);
			}
		}
	} catch (error) {
		console.error(`Erro ao atualizar dados. Banco: ${nomeDoBanco}. Erro: ${error.message}`);
	} finally {
		db.end();
	}
};
const salvarRegistrosGerenciais = async (dadosTratadosEmpresa, nomeDoBanco) => { 
	if (!dadosTratadosEmpresa) return console.warn("Não há dados para salvar na tabela risco_fator");
	
	const sql_risco_fator = `SELECT id_fator, porcentagem_risco FROM risco_fator;`;

	// 1. Recupera os dados do banco: risco_fator
	const dadosBancoEmpresa = await recuperarDadosGerenciaisDaEmpresa(nomeDoBanco, USUARIO_BD, sql_risco_fator); 

	// 2. Compara os dados do arquivo com o banco: risco_fator
	const registrosDiferentesEmpresa = filtrarRegistrosGerenciaisNovos(dadosTratadosEmpresa, dadosBancoEmpresa);
	
	// 3. Verifica se há novos registros para salvar ou atualizar: em risco_fator
	if (dadosBancoEmpresa.length === 0) {
		const inserir_risco_fator = `INSERT IGNORE INTO risco_fator(porcentagem_risco, id_fator) VALUES (?, ?)`;
		await salvarDadosGerenciais(registrosDiferentesEmpresa, nomeDoBanco, inserir_risco_fator);
		return true;
	} else if (registrosDiferentesEmpresa.length > 0) {
		const atualizar_risco_fator = `UPDATE risco_fator SET porcentagem_risco = ? WHERE id_fator = ?`;
		await atualizarDadosGerenciais(registrosDiferentesEmpresa, nomeDoBanco, atualizar_risco_fator);
		return true;
	} else {
		console.log(`Não há novos registros GERENCIAIS para salvar no banco: ${nomeDoBanco}`);
		return false;
	}
};
const salvarRegistrosGerenciaisSetor = async (dadosTratadosSetor, nomeDoBanco) => {
	const sql_risco_setor_fator = `SELECT setor, id_fator, porcentagem_risco FROM risco_setor_fator;`;

	// 1. Recupera os dados do banco: risco_setor_fator
	const dadosBancoSetor = await recuperarDadosGerenciaisDoSetor(nomeDoBanco, USUARIO_BD, sql_risco_setor_fator);

	// 2. Compara os dados do arquivo com o banco: risco_setor_fator
	const registrosDiferentesSetor = filtrarRegistrosGerenciaisNovosSetor(dadosTratadosSetor, dadosBancoSetor);

	// 3. Verifica se há novos registros para salvar ou atualizar: em risco_setor_fator
	if (dadosBancoSetor.length === 0) {
		const inserir_risco_setor_fator = `INSERT IGNORE INTO risco_setor_fator(porcentagem_risco, setor, id_fator) VALUES (?, ?, ?)`;
		await salvarDadosGerenciaisSetor(registrosDiferentesSetor, nomeDoBanco, inserir_risco_setor_fator);
		return true;

	} else if (registrosDiferentesSetor.length > 0) {
		const atualizar_risco_setor_fator = `UPDATE risco_setor_fator SET porcentagem_risco = ? WHERE setor = ? AND id_fator = ?`;

		// Validar os dados antes de executar o UPDATE
		const atualizaveis = registrosDiferentesSetor.filter(({ setor, fator, porcentagem_risco }) =>
			typeof setor === 'string' &&
			typeof fator === 'number' &&
			typeof porcentagem_risco === 'number'
		).map(({ setor, fator, porcentagem_risco }) => [porcentagem_risco, setor, fator]);
		await atualizarDadosGerenciaisSetor(atualizaveis, nomeDoBanco, atualizar_risco_setor_fator);
		return true;
	} else {
		//console.log(`Sem alterações necessárias na tabela risco_setor_fator BD: ${nomeDoBanco}.\n`);
		return false;
	}
};
export { salvarRegistrosNoBanco, salvarRegistrosGerenciais, salvarRegistrosGerenciaisSetor, limparBancosAntigos };