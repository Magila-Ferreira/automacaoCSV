import { gerenciadorDeConexoesBD } from "../config/configBanco.js";

const usuario = 'root'; // Usuário com todas as permissões para operar o banco

// Recuperar os registros do banco
const recuperarDadosDoBanco = async (nomeDoBanco, usuario) => {
	const seleciona_dados_identificacao = `SELECT id, setor, cargo, idade, escolaridade, estadoCivil, genero 
            FROM identificacao ORDER BY id ASC;`;

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
export { filtrarRegistrosNovos, recuperarDadosDoBanco, selecionarDadosPDF };
