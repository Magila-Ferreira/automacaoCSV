import { escalas, fatores, questoes } from '../conteudoEstatico/insertsEstaticos.js';
import { gerenciadorDeConexoesBD } from '../config/configBanco.js';
import { filtrarRegistrosNovos, recuperarDadosDoBanco } from './consultasBanco.js';

const usuario = 'root'; // Usuário com todas as permissões para operar o banco

const criarBanco = async (nomeDoBanco) => {
	// SQL
	const criar_banco = `CREATE DATABASE IF NOT EXISTS \`${nomeDoBanco}\`
    	CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`;

	const conexoes = gerenciadorDeConexoesBD(null, usuario);
	try {
		await conexoes.query(criar_banco); // Cria o banco de dados
		console.log(`Banco criado ou já existente: ${nomeDoBanco}`);
	} catch (error) {
		console.error("Erro ao criar o banco: ", error.message);
	} finally {
		conexoes.end();
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
			id: "INT AUTO_INCREMENT PRIMARY KEY",
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
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (setor, cargo, idade, escolaridade, estadoCivil, genero));`;

	const criar_tabela_questao_resposta = `CREATE TABLE IF NOT EXISTS questao_resposta (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_identificacao INT NOT NULL,
        id_questao INT NOT NULL,
        resposta VARCHAR(50) NOT NULL,
        FOREIGN KEY (id_identificacao) REFERENCES identificacao(id),
        FOREIGN KEY (id_questao) REFERENCES questao(id));`;

	const db = gerenciadorDeConexoesBD(nomeDoBanco, usuario); // Reutiliza a conexão com o banco
	try {
		// Criar tabelas 
		await db.query(criar_tabela_escala);
		await db.query(criar_tabela_fator);
		await db.query(criar_tabela_questao);
		await db.query(criar_tabela_identificacao);
		await db.query(criar_tabela_questao_resposta);
		db.end();
		console.log(`Tabelas criadas ou já existentes: ${nomeDoBanco}`);
	} catch (error) {
		console.error("Erro ao criar Tabelas: ", error.message);
	}
};

const salvarDados = async (dados, nomeDoBanco, questao_respostaCols) => {
	// SQL --> INSERTS
	const inserir_escala = `INSERT IGNORE INTO escala (nome) VALUES (?)`;
	const inserir_fator = `INSERT IGNORE INTO fator (nome, id_escala) VALUES (?, ?)`;
	const inserir_questao = `INSERT IGNORE INTO questao (afirmacao, id_fator) VALUES (?, ?)`;

	const inserir_identificacao = `INSERT IGNORE INTO identificacao 
        (setor, cargo, idade, escolaridade, estadoCivil, genero) 
        VALUES (?, ?, ?, ?, ?, ?)`;

	const inserir_questao_resposta = `INSERT IGNORE INTO questao_resposta 
        (id_identificacao, id_questao, resposta) VALUES (?, ?, ?)`;

	const db = gerenciadorDeConexoesBD(nomeDoBanco, usuario);
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
			const valores_identificacao = [item.setor, item.cargo, parseInt(item.idade, 10), item.escolaridade, item.estadoCivil, item.genero];

			// Insere na tabela 'identificação' caso não exista
			const [result] = await db.query(inserir_identificacao, valores_identificacao);
			const id_identificacao = result.insertId || (rows.length > 0 ? rows[0].id : null);

			// VERIFICAÇÃO ADICIONAL:
			if (id_identificacao) {

				// Insere as respostas associadas ao id_identificacao
				for (let i = 0; i < questao_respostaCols.length; i++) { // Itera sobre as colunas respostas
					const resposta = item[questao_respostaCols[i]]; // Obtém a resposta da questao (com base no índice da coluna)
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

const salvarRegistrosNoBanco = async (dadosTratados, nomeDoBanco, identificacaoCols, questao_respostaCols) => {
	// Criar banco
	await criarBanco(nomeDoBanco);
	await definirTabelas(nomeDoBanco, identificacaoCols);

	const dadosBanco = await recuperarDadosDoBanco(nomeDoBanco, usuario); // 1. Recupera os dados salvos no banco
	const novosRegistros = filtrarRegistrosNovos(dadosTratados, dadosBanco); // 2. Compara os dados do arquivo com o banco

	if (novosRegistros.length > 0) {
		await salvarDados(novosRegistros, nomeDoBanco, questao_respostaCols); // 3. Salvando os novos registros
	} else {
		console.log(`\nNão há novos registros para salvar no banco: ${nomeDoBanco} \n`);
	}
	return novosRegistros.length > 0;
};
export { salvarRegistrosNoBanco };