import { gerenciadorDeConexoesBD } from "../config/configBanco.js";

// Recupera os registros do banco
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
// Verifica quais dados do arquivo não estão registrados no banco
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
// Seleciona os dados do banco para salvar no PDF
const selecionarDadosPDF = async (database) => {
	const db = gerenciadorDeConexoesBD(database);

	try {
		// Seleciona os dados da empresa 
		const select_dados_empresa = `
			SELECT qr.id_identificacao, i.setor, f.nome AS fator, qr.id_questao, qr.resposta
			FROM questao_resposta qr 
			JOIN identificacao i ON qr.id_identificacao = i.id
			JOIN questao q ON qr.id_questao = q.id
			JOIN fator f ON q.id_fator = f.id
			WHERE f.id = 1
			ORDER BY qr.id_identificacao, i.setor, f.nome, qr.resposta;
		`;

		// Seleciona os dados por setor
		const select_dados_setor = ``; // Construir um array com os nomes dos setores para filtrar

		const [rows] = await db.query(select_dados_empresa);

		if (!rows || rows.length === 0) {
			console.warn("Não há dados para gerar o PDF!");
			return [];
		}

		// Inclusão dinâmica dos resultados
		return rows.map((row) => ({
			identificador: row.id_identificacao,   
			setor: row.setor,
			fator: row.fator,
			afirmativa: row.id_questao,
			resposta: row.resposta, 
		}));
	} catch (error) {
		console.error(
			`Erro ao selecionar dados para gerar PDF: ${error.message}`
		);
		return [];
	} finally {
		db.end();
	}
};
export { filtrarRegistrosNovos, recuperarDadosDoBanco, selecionarDadosPDF };
