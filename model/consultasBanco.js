import { gerenciadorDeConexoesBD } from "../config/configBanco.js";

const usuario = 'root'; // Usuário com todas as permissões para operar o banco

// Recuperar os registros do banco
const recuperarDadosDoBanco = async (nomeDoBanco, usuario) => {
	const seleciona_dados_identificacao = `SELECT id, setor, cargo, idade, escolaridade, estadoCivil, genero FROM identificacao ORDER BY id ASC;`;

	const db = gerenciadorDeConexoesBD(nomeDoBanco, usuario); // Conectar ao banco
	try {
		const [retorno_sql] = await db.query(seleciona_dados_identificacao);

		if (!retorno_sql || retorno_sql.length === 0) { return [] };

		return retorno_sql.map((linha_retorno_sql) => ({
			id: parseInt(linha_retorno_sql.id, 10),
			setor: linha_retorno_sql.setor?.trim(),
			cargo: linha_retorno_sql.cargo?.trim(),
			idade: parseInt(linha_retorno_sql.idade, 10),
			escolaridade: linha_retorno_sql.escolaridade?.trim(),
			estadoCivil: linha_retorno_sql.estadoCivil?.trim(),
			genero: linha_retorno_sql.genero?.trim(),
		}));

	} catch (error) {
		console.error(`Erro ao recuperar dados: ${error.message}`);
		return [];
	} finally {
		db.end();
	}
};

// Recupera os registros gerenciais do banco
const recuperarDadosGerenciaisDoBanco = async (nomeDoBanco, usuario) => {
	const db = gerenciadorDeConexoesBD(nomeDoBanco, usuario); // Conectar ao banco

	const seleciona_dados_risco_fator = `SELECT id_fator, porcentagem_risco FROM risco_fator;`;
	
	try {
		// Retorna os registros do banco, se houver
		const [registrosBanco] = await db.query(seleciona_dados_risco_fator);
		if (!registrosBanco || registrosBanco.length === 0) return [];

		return registrosBanco.map((registro) => ({
			id_fator: parseInt(registro.id_fator, 10),
			porcentagem_risco: parseFloat(registro.porcentagem_risco),
		}));

	} catch (error) {
		console.error(`Erro ao recuperar dados gerenciais: ${error.message}`);
		return [];
	} finally {
		db.end();
	}
}

// Verificar quais dados do arquivo não estão registrados no banco
const filtrarRegistrosNovos = (dadosArquivo, dadosBanco) => {

	// Converte os registros do banco em um Set de string JSON (para comparação)
	const registrosBanco = new Set(
		dadosBanco.map((item) => `${parseInt(item.id, 10)}-${item.setor?.trim()}-${item.cargo?.trim()}-${parseInt(item.idade, 10)}-${item.escolaridade?.trim()}-${item.estadoCivil?.trim()}-${item.genero?.trim()}`));

	// Filtra e armazena os dados que não estão no banco
	return dadosArquivo.filter((item) => {
		const registroArquivo = `${parseInt(item.id, 10)}-${item.setor?.trim()}-${item.cargo?.trim()}-${parseInt(item.idade, 10)}-${item.escolaridade?.trim()}-${item.estadoCivil?.trim()}-${item.genero?.trim()}`;
		return !registrosBanco.has(registroArquivo); // Retorna os registros que não estão no banco
	});
};

// Verificar quais dados gerenciais não estão inseridos na tabela risco_fator
const filtrarRegistrosGerenciaisNovos = (dadosArquivo, dadosBanco) => {
	// Transforma o  objeto em um array para aplicar o filtro
	const arrayDadosArquivo = Object.entries(dadosArquivo).map(([idFator, info]) => ({
		id_fator: parseInt(idFator, 10),
		porcentagem_risco: parseFloat(info.risco),
	}));

	// Retorna os registros diferentes do banco
	const diferentes = arrayDadosArquivo.filter(item => {
		const registroBanco = dadosBanco.find(registro => registro.id_fator === item.id_fator);
		return !registroBanco || registroBanco.porcentagem_risco !== item.porcentagem_risco;
	});
	return diferentes;
};

// Selecionar os dados do banco para salvar no PDF
const selecionarDadosPDF = async (nomeDoBanco, instrucao_sql, setor = null) => {
	const db = gerenciadorDeConexoesBD(nomeDoBanco, usuario);

	// Verificar se a instrucao_sql é selecionar_setores
	if (instrucao_sql.trim().toLowerCase().startsWith("select distinct setor")) {
		const [setores] = await db.query(instrucao_sql);
		return setores;
	}

	let resultados = {};
	try {
		for (let fator = 1; fator <= 10; fator++) {
			let parametros = setor ? [fator, setor] : [fator]; // Adicionar setor aos parâmetros
			const [retorno_sql] = await db.query(instrucao_sql, parametros);

			resultados[`fator_${fator}`] = retorno_sql.map(linha_retorno_sql => ({
				escala: linha_retorno_sql.escala,
				fator: linha_retorno_sql.fator,
				resposta: linha_retorno_sql.resposta,
				quantidade: linha_retorno_sql.quantidade,
				setor: linha_retorno_sql.setor || setor,
			}));
		};
		return resultados;

	} catch (error) {
		console.error(`Erro ao selecionar dados para gerar PDF: ${error.message}`);
		return {};
	} finally {
		db.end();
	}
};

// Selecionar dados GERENCIAIS para salvar no Banco
const selecionarDadosGerenciais = async (nomeDoBanco, instrucao_sql) => {
	const db = gerenciadorDeConexoesBD(nomeDoBanco, usuario);

	let resultados = {};
	try {
		const [retorno_sql] = await db.query(instrucao_sql);

		resultados = retorno_sql.map(linha_retorno_sql => ({
			escala: linha_retorno_sql.escala,
			fator: linha_retorno_sql.fator,
			questao: linha_retorno_sql.id_questao,
			resposta: linha_retorno_sql.resposta,
			quantidade: linha_retorno_sql.quantidade,
		}));
		return resultados;

	} catch (error) {
		console.error(`Erro ao selecionar dados GERENCIAIS para gerar PDF: ${error.message}`);
		return {};
	} finally {
		db.end();
	}
};

// Selecionar dados GERENCIAIS para salvar no PDF
const selecionarDadosGerenciaisPDF = async (nomeDoBanco, instrucao_sql, setor = null) => { 
	const db = gerenciadorDeConexoesBD(nomeDoBanco, usuario);

	// Caso a instrução seja para obter os setores, retorna-os
	if (instrucao_sql.trim().toLowerCase().startsWith("select distinct setor")) {
		const [setores] = await db.query(instrucao_sql);
		return setores;
	}

	let resultados = {};
	try { 
		// Executa a query recebida
		const [linhas] = await db.query(instrucao_sql);

		// Transforma o resultado em um objeto agrupado por nome do fator
		resultados = linhas.reduce((objeto, linha) => {
			const { fator, escala, porcentagem_risco, id_fator } = linha;
			const chaveEscala = linha.escala; 

			// Cria um array por nome do fator, se ainda não existir
			if (!objeto[chaveEscala]) {
				objeto[chaveEscala] = [];
			}

			// Adiciona os dados do risco nesse fator
			objeto[chaveEscala].push({
				fator,
				escala,
				porcentagem_risco,
				id_fator,
			});
			return objeto;
		}, {});
		return resultados;
	} catch (error) {
		console.error(`Erro ao selecionar dados Gerenciais para o PDF: ${error.message}`);
		return {};
	}
};

export {
	recuperarDadosDoBanco,
	recuperarDadosGerenciaisDoBanco,
	filtrarRegistrosNovos,
	filtrarRegistrosGerenciaisNovos,
	selecionarDadosPDF, 
	selecionarDadosGerenciais,
	selecionarDadosGerenciaisPDF,
};
