import { selecionarDadosGerenciais, selecionarDadosGerenciaisSetor, selecionarDadosGerenciaisPDF } from "../model/consultasBanco.js";
import { pesos } from "../conteudoEstatico/insertsEstaticos.js";
import { pdfDaEmpresa } from "./pdfGerencialEmpresa.js";
import { introducaoGerencial } from "../conteudoEstatico/introducaoPDF.js";
import { normalizarDadosParaOBanco, normalizarDadosSetorParaOBanco } from "../normatizacao/dadosGerenciais.js";
import { salvarRegistrosGerenciais, salvarRegistrosGerenciaisSetor } from "../model/operacoesBanco.js";

// SLQ
// /* ----------> Respostas da empresa agrupadas por questão <---------- */
const respostasPorQuestao = `
	SELECT f.id AS fator, qr.id_questao, qr.resposta, COUNT(*) AS quantidade 
	FROM questao_resposta qr 
	JOIN questao q ON qr.id_questao = q.id
	JOIN fator f ON q.id_fator = f.id
	GROUP BY qr.id_questao, qr.resposta
	ORDER BY qr.id_questao;
`;
const riscoPorFator = ` 
	SELECT f.nome AS fator, rf.porcentagem_risco, e.nome AS escala, f.id AS id_fator
	FROM risco_fator rf
	JOIN fator f ON rf.id_fator = f.id
	JOIN escala e ON f.id_escala = e.id
	GROUP BY id_fator, rf.porcentagem_risco;
`;
const respostaPorQuestaoSetor = `
SELECT f.nome AS fator, f.id AS id_fator,
	e.nome AS escala,
    i.setor AS setor,
	q.id AS questao,
	qr.resposta AS resposta,
	COUNT(*) AS quantidade
FROM fator f
	JOIN escala e ON f.id_escala = e.id
	JOIN questao q ON f.id = q.id_fator
	JOIN questao_resposta qr ON q.id = qr.id_questao
	JOIN identificacao i ON qr.id_identificacao = i.id
GROUP BY resposta, questao, setor
ORDER BY questao, setor;
`;
// /* ----------> Respostas do Setor agrupadas por questão <---------- */
async function acrescentaPesosEPonderacao(dadosGerenciais) {

	// Insere a propriedade peso em cada resposta
	const dadosComPesos = dadosGerenciais.map((item) => {
		const numeroQuestao = `questao${item.questao}`;
		const resposta = item.resposta.toLowerCase();
		const peso = pesos[numeroQuestao]?.[resposta] ?? null;
		return {
			...item, peso
		};
	});

	const agrupamentoPorQuestao = {};
	// Agrupa os dados por questao
	dadosComPesos.forEach((item) => {
		const idQuestao = item.questao;

		// Calcula a ponderação da resposta
		const ponderacao = item.quantidade * item.peso;

		if (!agrupamentoPorQuestao[idQuestao]) {
			agrupamentoPorQuestao[idQuestao] = {
				fator: item.fator,
				respostas: []
			};
		}

		agrupamentoPorQuestao[idQuestao].respostas.push({
			setor: item.setor,
			escala: item.escala,
			id_fator: item.id_fator,
			resposta: item.resposta,
			quantidade: item.quantidade,
			peso: item.peso,
			ponderacao,
		});
	});
	return agrupamentoPorQuestao;
};
async function acrescentaPorcentagem(dadosGerenciais) {
	// Seção: porcentagem ponderada por questão em dadosGerenciais
	const dadosGerenciaisQuestao = [];

	Object.entries(dadosGerenciais).forEach(([idQuestao, questao]) => {

		// Cálculo da soma das ponderações
		const totalPonderacao = questao.respostas.reduce((total, item) => total + item.ponderacao, 0);

		questao.respostas.forEach((resposta) => {

			// Cálculo da porcentagem ponderada
			const porcentagem = totalPonderacao > 0 ? ((resposta.ponderacao / totalPonderacao) * 100) : 0;

			// Adiciona a porcentagem ao objeto dadosGerenciaisQuestao
			dadosGerenciaisQuestao.push({
				setor: resposta.setor,
				escala: resposta.escala,
				id_fator: resposta.id_fator,
				fator: questao.fator,
				questao: Number(idQuestao),
				resposta: resposta.resposta,
				quantidade: resposta.quantidade,
				peso: resposta.peso,
				ponderacao: resposta.ponderacao,
				porcentagem: porcentagem.toFixed(3),
			});
		});
	});
	return dadosGerenciaisQuestao;
}
async function calcularRiscoPorFator(dadosGerenciais) {
	// Agrupar os dados por fator
	const agrupamentoPorFator = {};

	dadosGerenciais.forEach((item) => {
		const fator = item.fator;

		if (!agrupamentoPorFator[fator]) {
			agrupamentoPorFator[fator] = {
				respostas: [],
				risco: null,
			};
		};
		agrupamentoPorFator[fator].respostas.push(item);
	});

	// Seleciona as respostas com peso 1 e 2
	for (const fator in agrupamentoPorFator) {
		const respostas = agrupamentoPorFator[fator].respostas;

		// Agrupa respostas por questão
		const respostasPorQuestao = {};
		respostas.forEach((resposta) => {
			const idQuestao = resposta.questao;
			if (!respostasPorQuestao[idQuestao]) {
				respostasPorQuestao[idQuestao] = [];
			}
			respostasPorQuestao[idQuestao].push(resposta);
		});

		// Soma todas as porcentagens com peso 1 e 2, por questão
		const somaDasPorcentagensComPesos1e2PorQuestao = [];

		for (const questao in respostasPorQuestao) {
			const respostas = respostasPorQuestao[questao];
			const respostasComPeso1e2 = respostas.filter((resposta) => resposta.peso === 1 || resposta.peso === 2);
			const somaPorcentagens = respostasComPeso1e2.reduce((total, resposta) => total + parseFloat(resposta.porcentagem), 0);
			somaDasPorcentagensComPesos1e2PorQuestao.push(somaPorcentagens);
		}

		// Número de questão no fator
		const numeroDeQuestoesNoFator = somaDasPorcentagensComPesos1e2PorQuestao.length;

		// Média simples das somas por fator
		const mediaRisco = somaDasPorcentagensComPesos1e2PorQuestao.length > 0 ? somaDasPorcentagensComPesos1e2PorQuestao.reduce((total, valor) => total + valor, 0) / numeroDeQuestoesNoFator : 0;

		// Atribuir o risco ao fator
		agrupamentoPorFator[fator].risco = Number(mediaRisco.toFixed(3));
	}
	return agrupamentoPorFator;
};
async function agruparDadosPorSetor(dadosGerenciais) { 
	const agrupadoPorSetor = {};

	Object.entries(dadosGerenciais).forEach(([idQuestao, { fator, respostas }]) => {
		respostas.forEach(resposta => {
			const { setor } = resposta;

			// Cria o agrupamento por setor, se não existir
			if (!agrupadoPorSetor[setor]) {
				agrupadoPorSetor[setor] = {};
			}

			// Insere o fator e um agrupamento vazio de respostas dentro dos agrupamentos [setor] => [questão]
			if (!agrupadoPorSetor[setor][idQuestao]) {
				agrupadoPorSetor[setor][idQuestao] = {
					fator,
					respostas: []
				};
			}
			// Aloca os dados de resposta dentro do agrupamento vazio de respostas
			agrupadoPorSetor[setor][idQuestao].respostas.push(resposta);
		});
	});
	return agrupadoPorSetor;
};
async function acrescentaPorcentagemFatorPorSetor(dadosGerenciaisSetor) {
	const agrupadoComPorcentagem = {};

	Object.entries(dadosGerenciaisSetor).forEach(([setor, questoes]) => {
		if (!agrupadoComPorcentagem[setor]) {
			agrupadoComPorcentagem[setor] = {};
		}

		Object.entries(questoes).forEach(([idQuestao, questao]) => {
			if (!Array.isArray(questao.respostas)) return;

			const totalPonderacao = questao.respostas.reduce((total, item) => total + item.ponderacao, 0);

			const respostasComPorcentagem = questao.respostas.map(resposta => {
				const porcentagem = totalPonderacao > 0
					? (resposta.ponderacao / totalPonderacao) * 100
					: 0;

				return {
					...resposta,
					porcentagem: porcentagem.toFixed(3)
				};
			});

			agrupadoComPorcentagem[setor][idQuestao] = {
				fator: questao.fator,
				respostas: respostasComPorcentagem
			};
		});
	});
	return agrupadoComPorcentagem;
}
async function calcularRiscoPorSetorEFator(dadosGerenciaisSetor) { 
	const agrupado = {};

	// Etapa 1: Agrupar por setor -> fator
	for (const chave in dadosGerenciaisSetor) {
		const grupo = dadosGerenciaisSetor[chave];

		for (const subchave in grupo) {
			const questao = grupo[subchave];
			const { fator, respostas } = questao;

			respostas.forEach(resposta => {
				const { setor } = resposta;

				if (!agrupado[setor]) agrupado[setor] = {};
				if (!agrupado[setor][fator]) {
					agrupado[setor][fator] = {
						respostas: [],
						risco: null
					};
				}

				// Supondo que `questao` seja o id da questão para identificação no agrupamento
				const respostaComId = {
					...resposta,
					questao: subchave
				};

				agrupado[setor][fator].respostas.push(respostaComId);
			});
		}
	}

	// Etapa 2: Calcular risco com base nas respostas agrupadas
	for (const setor in agrupado) {
		for (const fator in agrupado[setor]) {
			const respostas = agrupado[setor][fator].respostas;

			// Agrupar por id da questão
			const respostasPorQuestao = {};
			respostas.forEach(resposta => {
				const idQuestao = resposta.questao;
				if (!respostasPorQuestao[idQuestao]) {
					respostasPorQuestao[idQuestao] = [];
				}
				respostasPorQuestao[idQuestao].push(resposta);
			});

			// Soma todas as porcentagens com peso 1 e 2, por questão
			const somaDasPorcentagensComPesos1e2PorQuestao = [];

			for (const questao in respostasPorQuestao) {
				const respostasDaQuestao = respostasPorQuestao[questao];
				const respostasComPeso1e2 = respostasDaQuestao.filter(r => r.peso === 1 || r.peso === 2);
				const somaPorcentagens = respostasComPeso1e2.reduce((total, r) => total + parseFloat(r.porcentagem), 0);
				somaDasPorcentagensComPesos1e2PorQuestao.push(somaPorcentagens);
			}

			const numeroDeQuestoesNoFator = Object.keys(respostasPorQuestao).length;

			const mediaRisco =
				numeroDeQuestoesNoFator > 0
					? somaDasPorcentagensComPesos1e2PorQuestao.reduce((total, v) => total + v, 0) / numeroDeQuestoesNoFator
					: 0;

			agrupado[setor][fator].risco = Number(mediaRisco.toFixed(3));
		}
	}

	return agrupado;
};

const disponibilizarPDFGerencial = async (nomeDoBanco, pastaSaida, nomeDaEmpresa) => {
	const tipoRelatorio = "RELATÓRIO GERENCIAL";
	try {
		// Selecionar dados organizados por id_questao
		let dadosGerenciais = await selecionarDadosGerenciais(nomeDoBanco, respostasPorQuestao);

		// Selecionar dados organizados por setor
		let dadosGerenciaisSetor = await selecionarDadosGerenciaisSetor(nomeDoBanco, respostaPorQuestaoSetor);
		
		// Sistematiza os dados da EMPRESA para gerar o PDF
		dadosGerenciais = await acrescentaPesosEPonderacao(dadosGerenciais); // Calcula ponderação
		dadosGerenciais = await acrescentaPorcentagem(dadosGerenciais); // Calcula porcentagem
		dadosGerenciais = await calcularRiscoPorFator(dadosGerenciais); // Calcula o risco por fator

		// Sistematiza os dados do SETOR para gerar o PDF
		dadosGerenciaisSetor = await acrescentaPesosEPonderacao(dadosGerenciaisSetor); // Calcula ponderação		
		dadosGerenciaisSetor = await agruparDadosPorSetor(dadosGerenciaisSetor); // Agrupa os dados por setor
		dadosGerenciaisSetor = await acrescentaPorcentagemFatorPorSetor(dadosGerenciaisSetor); // Calcula porcentagem
		dadosGerenciaisSetor = await calcularRiscoPorSetorEFator(dadosGerenciaisSetor); // Calcula o risco por setor
		
		// Normalização dos dados gerenciais: EMPRESA e SETOR
		dadosGerenciais = normalizarDadosParaOBanco(dadosGerenciais);
		dadosGerenciaisSetor = normalizarDadosSetorParaOBanco(dadosGerenciaisSetor);	

		//console.log(JSON.stringify(dadosGerenciaisSetor, null, 2));

		// Salvar risco_fator e risco_setor_fator no banco
		await salvarRegistrosGerenciais(dadosGerenciais, nomeDoBanco);
		// -------------------------------->					ERRO:
		// await salvarRegistrosGerenciaisSetor(dadosGerenciaisSetor, nomeDoBanco);
		
		// Selecionar os dados do banco para gerar o PDF Gerencial
		const dadosGerenciaisEmpresa = await selecionarDadosGerenciaisPDF(nomeDoBanco, riscoPorFator);

		
		// Verificar se há dados para gerar o PDF
		const empresaSemDados = Object.values(dadosGerenciaisEmpresa).flat().length === 0;
		if (empresaSemDados) {
			console.warn(`\nNenhum dado disponível para gerar PDF. ARQUIVO: ${nomeDoBanco}`);
			return;
		}

		// Gerar o PDF da empresa
		const pdfGerencialEmpresa = await pdfDaEmpresa(dadosGerenciaisEmpresa, pastaSaida, `${nomeDoBanco}_Empresa`, tipoRelatorio, introducaoGerencial, nomeDaEmpresa);
		console.log(`PDF GERENCIAL da Empresa --> gerado e salvo com sucesso!\n`);

	} catch (error) {
		console.error(`Erro ao gerar PDFs: ${error.message}`);
	}
};

export { disponibilizarPDFGerencial };

// Passo 5: Gerar PDF gerencial - Setor

// Passo 7: Inserir gráficos no PDF gerencial - Setor

// Passo 9: Gerar e salvar o PDF gerencial - Setor