import { selecionarDadosGerenciais, selecionarDadosGerenciaisPDF } from "../model/consultasBanco.js";
import { pesos } from "../conteudoEstatico/insertsEstaticos.js";
import { pdfDaEmpresa } from "./pdfGerencialEmpresa.js";
import { introducaoGerencial } from "../conteudoEstatico/introducaoPDF.js";
import { normalizarDadosParaOBanco } from "../normatizacao/dadosGerenciaisEmpresa.js";
import { salvarRegistrosGerenciais } from "../model/operacoesBanco.js";

// SLQ
// /* ----------> Respostas da empresa agrupadas por questão <---------- */
const respostasPorQuestao = `
			SELECT e.nome AS escala, f.id AS fator, qr.id_questao, qr.resposta, COUNT(*) AS quantidade 
			FROM questao_resposta qr 
			JOIN questao q ON qr.id_questao = q.id
			JOIN fator f ON q.id_fator = f.id
			JOIN escala e ON f.id_escala = e.id
			GROUP BY qr.id_questao, qr.resposta
			ORDER BY qr.id_questao;
`;
const riscoPorFator = ` 
	SELECT rf.id AS id_risco, f.nome AS fator, rf.porcentagem_risco, e.nome AS escala, f.id AS id_fator
	FROM risco_fator rf
	JOIN fator f ON rf.id_fator = f.id
	JOIN escala e ON f.id_escala = e.id
	GROUP BY id_fator, id_risco, rf.porcentagem_risco;
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
			resposta: item.resposta,
			quantidade: item.quantidade,
			peso: item.peso,
			ponderacao,
			escala: item.escala,
		});
	});
	return agrupamentoPorQuestao;
};
async function acrescentaPorcentagem(agrupamentoPorQuestao) {
	// Seção: porcentagem ponderada por questão em dadosGerenciaisEmpresa
	const dadosGerenciaisEmpresa = [];

	Object.entries(agrupamentoPorQuestao).forEach(([idQuestao, questao]) => {

		// Cálculo da soma das ponderações
		const totalPonderacao = questao.respostas.reduce((total, item) => total + item.ponderacao, 0);

		questao.respostas.forEach((resposta) => {

			// Cálculo da porcentagem ponderada
			const porcentagem = totalPonderacao > 0 ? ((resposta.ponderacao / totalPonderacao) * 100) : 0;

			// Adiciona a porcentagem ao objeto dadosGerenciaisEmpresa
			dadosGerenciaisEmpresa.push({
				escala: resposta.escala,
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
	return dadosGerenciaisEmpresa;
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

		// Soma das porcentagens com peso 1 e 2, por questão
		const somaDasPorcentagensComPesos1e2PorQuestao = [];

		for (const questao in respostasPorQuestao) {
			const respostas = respostasPorQuestao[questao];
			const respostasComPeso1e2 = respostas.filter((resposta) => resposta.peso === 1 || resposta.peso === 2);

			if (respostasComPeso1e2.length > 0) {
				const somaPorcentagens = respostasComPeso1e2.reduce((total, resposta) => total + parseFloat(resposta.porcentagem), 0);
				somaDasPorcentagensComPesos1e2PorQuestao.push(somaPorcentagens);
			}
		}
		// Média simples das somas por questão
		const mediaRisco = somaDasPorcentagensComPesos1e2PorQuestao.length > 0 ? somaDasPorcentagensComPesos1e2PorQuestao.reduce((total, valor) => total + valor, 0) / somaDasPorcentagensComPesos1e2PorQuestao.length : 0;

		// Atribuir o risco ao fator
		agrupamentoPorFator[fator].risco = Number(mediaRisco.toFixed(3));
	}
	return agrupamentoPorFator;
};

const disponibilizarPDFGerencial = async (nomeDoBanco, pastaSaida) => {
	const tipoRelatorio = "RELATÓRIO GERENCIAL";
	try {
		// Selecionar dados organizados por id_questao
		let dadosGerenciais = await selecionarDadosGerenciais(nomeDoBanco, respostasPorQuestao);

		// Sistematiza os dados para gerar o PDF
		dadosGerenciais = await acrescentaPesosEPonderacao(dadosGerenciais); // Calcula ponderação
		dadosGerenciais = await acrescentaPorcentagem(dadosGerenciais); // Calcula porcentagem
		dadosGerenciais = await calcularRiscoPorFator(dadosGerenciais); // Calcula o risco por fator

		// Normalização dos dados gerenciais
		dadosGerenciais = normalizarDadosParaOBanco(dadosGerenciais);

		// Salvar risco por fator no banco
		await salvarRegistrosGerenciais(dadosGerenciais, nomeDoBanco);

		// Selecionar os dados do banco para gerar o PDF Gerencial
		const dadosGerenciaisEmpresa = await selecionarDadosGerenciaisPDF(nomeDoBanco, riscoPorFator);
		
		// Verificar se há dados para gerar o PDF
		const empresaSemDados = Object.values(dadosGerenciaisEmpresa).flat().length === 0;
		if (empresaSemDados) {
			console.warn(`\nNenhum dado disponível para gerar PDF. ARQUIVO: ${nomeDoBanco}`);
			return;
		}

		// Gerar o PDF da empresa
		const pdfGerencialEmpresa = await pdfDaEmpresa(dadosGerenciaisEmpresa, pastaSaida, `${nomeDoBanco}_Empresa`, tipoRelatorio, introducaoGerencial);
		console.log(`PDF (Gerencial) da Empresa --> gerado e salvo em: ${pdfGerencialEmpresa} \n`);

	} catch (error) {
		console.error(`Erro ao gerar PDFs: ${error.message}`);
	}
};

export { disponibilizarPDFGerencial };

// Passo 5: Gerar PDF gerencial - Setor

// Passo 7: Inserir gráficos no PDF gerencial - Setor

// Passo 9: Gerar e salvar o PDF gerencial - Setor