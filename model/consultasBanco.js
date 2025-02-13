import { gerenciadorDeConexoesBD } from "../config/configBanco.js";

// Recuperar os registros do banco
const recuperarDadosDoBanco = async (database) => {
	const db = gerenciadorDeConexoesBD(database);
	try {
		const select_dados_identificacao = `
            SELECT setor, cargo, idade, escolaridade, estadoCivil, genero 
            FROM identificacao`;

		const [rows] = await db.query(select_dados_identificacao);

		if (!rows || rows.length === 0) {
			return [];
		}
		return rows.map((row) => ({
			setor: row.setor?.trim(),
			cargo: row.cargo?.trim(),
			idade: parseInt(row.idade, 10),
			escolaridade: row.escolaridade?.trim(),
			estadoCivil: row.estadoCivil?.trim(),
			genero: row.genero?.trim(),
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
		dadosBanco.map(
			(item) =>
				`${item.setor?.trim()}-${item.cargo?.trim()}-${parseInt(
					item.idade,
					10
				)}-${item.escolaridade?.trim()}-${item.estadoCivil?.trim()}-${item.genero?.trim()}`
		)
	);

	// Filtra os dados que não estão no banco
	return dadosArquivo.filter((item) => {
		const registroArquivo = `${item.setor?.trim()}-${item.cargo?.trim()}-${parseInt(
			item.idade,
			10
		)}-${item.escolaridade?.trim()}-${item.estadoCivil?.trim()}-${item.genero?.trim()}`;

		return !registrosBanco.has(registroArquivo); // Retorna os registros que não estão no banco
	});
};
// Selecionar os dados do banco para salvar no PDF
const selecionarDadosPDF = async (database, instrucao_select, setor = null) => {
	const db = gerenciadorDeConexoesBD(database);

	// Verificar se a instrucao_select é select_setores
	if (instrucao_select.trim().toLowerCase().startsWith("select distinct setor")) {
		const [rows] = await db.query(instrucao_select);
		return rows;
	}

	let resultados = {};
	try {
		for (let fator = 1; fator <= 10; fator++) {
			let parametros = setor ? [fator, setor] : [fator]; // Adicionar setor aos parâmetros
			const [rows] = await db.query(instrucao_select, parametros);

			resultados[`fator_${fator}`] = rows.map(row => ({
				escala: row.escala,
				fator: row.fator,
				resposta: row.resposta,
				quantidade: row.quantidade,
				setor: row.setor || setor, 
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
