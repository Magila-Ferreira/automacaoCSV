import fs from "fs";
import { selecionarDadosGerenciais, selecionarDadosGerenciaisPDF, consultarSetores } from "../model/consultasBanco.js";
import { pesos } from "../conteudoEstatico/insertsEstaticos.js";
import { pdfDaEmpresa, pdfPorSetor } from "./pdfGerencial.js";
import { introducaoGerencial } from "../conteudoEstatico/introducaoPDF.js";
import { normalizarDadosEmpresa, normalizarDadosSetor, agruparDadosPorSetor, estruturaDadosPorSetor } from "../normatizacao/dadosGerenciais.js";
import { salvarRegistrosGerenciais, salvarRegistrosGerenciaisSetor } from "../model/operacoesBanco.js";
import { pdfAberto } from "../pdf/verificaStatusPdf.js";

// SLQ
// /* ----------> Respostas da empresa agrupadas por questão <---------- */
const respostasPorQuestao = `
	SELECT qr.id_questao AS questao, qr.resposta, COUNT(*) AS quantidade, f.id AS fator
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
// /* ----------> Respostas do Setor agrupadas por questão <---------- */
const selecionar_setores = `SELECT DISTINCT setor FROM identificacao ORDER BY setor;`;

const respostaPorQuestaoSetor = `
	SELECT qr.id_questao AS questao, qr.resposta AS resposta, COUNT(*) AS quantidade, f.id AS fator, i.setor AS setor
	FROM questao_resposta qr
	JOIN questao q ON qr.id_questao = q.id
	JOIN fator f ON q.id_fator = f.id
	JOIN identificacao i ON qr.id_identificacao = i.id
	WHERE i.setor = ?
	GROUP BY qr.id_questao, qr.resposta, i.setor, f.id
	ORDER BY qr.id_questao, qr.resposta;
`;
const riscoPorSetorEFator = `
	SELECT rs.id_fator AS id_fator, rs.porcentagem_risco, rs.setor AS setor, e.nome AS escala, f.nome AS fator
	FROM risco_setor_fator rs
	JOIN fator f ON rs.id_fator = f.id
	JOIN escala e ON f.id_escala = e.id
	GROUP BY setor, id_fator, porcentagem_risco
	ORDER BY setor, id_fator;
`;
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
// Função principal que decide como processar os dados recebidos
async function calcularRiscoEmpresaOuSetor(dadosGerenciais) {
	if (!dadosGerenciais) return {};

	// Verifica se os dados estão na estrutura de um objeto e não são nulos
	if (typeof dadosGerenciais === 'object' && dadosGerenciais !== null) {
		const chavesPrincipais = Object.keys(dadosGerenciais); // Obtém as chaves principais do objeto (1º nível)

		// Verifica se a chave principal é um nome de setor [não um número de questão]
		const isSetor = chavesPrincipais.every(chave => isNaN(Number(chave)));

		// Verifica se a estrutura interna corresponde aos dados do setor
		const isEstruturaSetor = isSetor && chavesPrincipais.every(setor => {
			const dadosSetor = dadosGerenciais[setor];
			
			return typeof dadosSetor === 'object'
				&& dadosSetor !== null
				&& Object.keys(dadosSetor).every(subchave => !isNaN(Number(subchave)));
		});
		
		if (isEstruturaSetor) {
			// Caso seja dadosGerenciaisSetor (tem setor)
			return calcularRiscoPorSetor(dadosGerenciais);
		} else {
			// Caso seja dadosGerenciais (não tem setor)
			return calcularRiscoPorEmpresa(dadosGerenciais);
		}
	}
	// Se não for um objeto (por segurança), retorna vazio
	return {};
}
// Para dados da empresa (sem setor): agrupa por fator
function calcularRiscoPorEmpresa(dadosPorQuestao) {
	const dadosPorFator = {};

	// Itera sobre cada questao
	for (const questaoId in dadosPorQuestao) {
		const { fator, respostas } = dadosPorQuestao[questaoId];

		// Se o fator ainda não foi criado, inicializa-o
		if (!dadosPorFator[fator]) {
			dadosPorFator[fator] = {
				totalPonderado: 0,
				risco: null,
				respostas: [],
			};
		}

		// Adiciona cada resposta com o número da questão embutido
		const respostasComQuestao = respostas.map(resposta => ({
			...resposta,
			questao: Number(questaoId)
		}));	
		
		dadosPorFator[fator].respostas.push(...respostasComQuestao);
		
		respostas.forEach(resposta => {
			dadosPorFator[fator].totalPonderado += resposta.ponderacao;
		});

	};

	for (const fator in dadosPorFator) {
		dadosPorFator[fator].risco = calcularRisco(dadosPorFator[fator]);
	}
	return dadosPorFator;
}
// Para dados com setor: agrupa por setor > fator
function calcularRiscoPorSetor(dadosPorQuestaoComSetor) {
	const dadosPorSetorEFator = {};

	// Itera sobre cada setor
	for (const setor in dadosPorQuestaoComSetor) { 
		const dadosDoSetor = dadosPorQuestaoComSetor[setor];

		// Inicializa o setor na nova estrutura
		dadosPorSetorEFator[setor] = {};

		// Itera sobre cada questão dentro do setor
		for (const questaoId in dadosDoSetor) { 
			const { fator, respostas } = dadosDoSetor[questaoId];

			// Inicializa o fator se ele não existir
			if (!dadosPorSetorEFator[setor][fator]) {
				dadosPorSetorEFator[setor][fator] = {
					totalPonderado: 0,
					risco: null,
					respostas: [],
				};
			}

			// Adiciona as respostas ao fator, incluindo setor e número da questão
			const respostasComSetor = respostas.map(resposta => ({
				...resposta,
				setor: setor,
				questao: Number(questaoId)
			}));

			// Adiciona as respostas ao fator
			dadosPorSetorEFator[setor][fator].respostas.push(...respostasComSetor);

			// Soma as ponderações por fator [no setor]
			respostas.forEach(resposta => {
				dadosPorSetorEFator[setor][fator].totalPonderado += resposta.ponderacao;
			});
		}
	}
	
	// Chama a função de cálculo de risco passando apenas as respostas do fator [dentro do setor]
	for (const setor in dadosPorSetorEFator) {
		for (const fator in dadosPorSetorEFator[setor]) {
			dadosPorSetorEFator[setor][fator].risco = calcularRisco(dadosPorSetorEFator[setor][fator]);
		}
	}
	return dadosPorSetorEFator;
}
// Calcular o risco
function calcularRisco(dadosFator) {
	const riscoPorFator = {};

	// Desestruturação das respostas 
	Object.entries(dadosFator).forEach(({ peso, ponderacao }) => {
		if (!riscoPorFator) {
			riscoPorFator = [];
		}
	});

	// Total Ponderado no fator
	const totalPonderado = dadosFator.totalPonderado || 0;

	// Soma das ponderações com peso 5, 4 e 3 ---> REPRESENTAM RISCO
	const somaPonderacaoComRisco = dadosFator.respostas.filter(resposta => [5, 4, 3].includes(resposta.peso))
		.reduce((total, resposta) => total + resposta.ponderacao, 0);
	
	// Soma das ponderações com peso 1 e 2 ---> SEM RISCO
	const somaPonderacaoSemRisco = dadosFator.respostas.filter(resposta => [1, 2].includes(resposta.peso))
	.reduce((total, resposta) => total + resposta.ponderacao, 0);

	// Cálculo do risco: divide-se a somaPonderacaoDeRisco [pesos 5, 4 e 3] pela soma total das ponderações * 100
	const risco = somaPonderacaoComRisco / totalPonderado * 100 || 0;

	return Number(risco.toFixed(1));
}
const disponibilizarPDFGerencial = async (nomeDoBanco, pastaSaida, nomeDaEmpresa) => {
	const tipoRelatorio = "GRAU DE RISCO PONDERADO"; // Mudança do nome afeta a função de gerar grafico
	try {
		// Selecionar os setores
		const setores = await consultarSetores(nomeDoBanco, selecionar_setores); // Objeto com chave
		const setoresDaEmpresa = setores.map((item) => item.setor); // Objeto sem chave (só o conteúdo)

		// Selecionar dados organizados por id_questao
		let dadosGerenciaisEmpresa = await selecionarDadosGerenciais(nomeDoBanco, respostasPorQuestao);
		let dadosGerenciaisSetor = await selecionarDadosGerenciais(nomeDoBanco, respostaPorQuestaoSetor, setoresDaEmpresa);

		// Cálculo do risco por fator
		dadosGerenciaisEmpresa = await acrescentaPesosEPonderacao(dadosGerenciaisEmpresa); // Calcula ponderação
		dadosGerenciaisEmpresa = await calcularRiscoEmpresaOuSetor(dadosGerenciaisEmpresa); // Calcula o risco por fator

		dadosGerenciaisSetor = await acrescentaPesosEPonderacao(dadosGerenciaisSetor); // Calcula ponderação		
		dadosGerenciaisSetor = await agruparDadosPorSetor(dadosGerenciaisSetor); // Agrupa os dados por setor
		dadosGerenciaisSetor = await calcularRiscoEmpresaOuSetor(dadosGerenciaisSetor); // Calcula o risco por setor
				
		// Normalização dos dados gerenciais: EMPRESA e SETOR
		dadosGerenciaisEmpresa = normalizarDadosEmpresa(dadosGerenciaisEmpresa);
		dadosGerenciaisSetor = normalizarDadosSetor(dadosGerenciaisSetor);

		// Salvar risco_fator e risco_setor_fator no banco
		await salvarRegistrosGerenciais(dadosGerenciaisEmpresa, nomeDoBanco);
		await salvarRegistrosGerenciaisSetor(dadosGerenciaisSetor, nomeDoBanco);

		// Selecionar os dados do banco para gerar PDF Gerencial
		const dadosEmpresaPdf = await selecionarDadosGerenciaisPDF(nomeDoBanco, riscoPorFator);
		const dadosSetorPdf = await selecionarDadosGerenciaisPDF(nomeDoBanco, riscoPorSetorEFator);
		const dadosEstruturadosSetorPdf = await estruturaDadosPorSetor(dadosSetorPdf);
		
		// Verificar se há dados para gerar o PDF
		const empresaSemDados = Object.values(dadosEmpresaPdf).flat().length === 0;
		const setorSemDados = Object.values(dadosEstruturadosSetorPdf).flat().length === 0;

		if (empresaSemDados || setorSemDados) {
			console.warn(`\nNenhum dado disponível para gerar os PDF's (Grau de risco ponderado). BD: ${nomeDoBanco}`);
			return;
		}

		// Verifica se o arquivo não está aberto, antes de gerar o PDF
		const caminhoCompletoEmpresa = `${pastaSaida}\\${nomeDaEmpresa}_Empresa - ${tipoRelatorio}.pdf`;
		const caminhoCompletoSetores = `${pastaSaida}\\${nomeDaEmpresa}_Setores - ${tipoRelatorio}.pdf`;

		while ((fs.existsSync(caminhoCompletoEmpresa) && await pdfAberto(caminhoCompletoEmpresa))
			|| (fs.existsSync(caminhoCompletoSetores) && await pdfAberto(caminhoCompletoSetores))) {
			console.log(`Arquivo(s) PDF em uso. Feche-o(s) para continuar...`);
			await new Promise(resolve => setTimeout(resolve, 10000)); // Espera 10 segundos
		}

		// Gerar os PDF's Grau de risco ponderado 'Empresa' e 'Setor'
		await pdfDaEmpresa(dadosEmpresaPdf, pastaSaida, `${nomeDaEmpresa}_Empresa`, tipoRelatorio, introducaoGerencial, nomeDaEmpresa);
		console.log(`PDF da Empresa (Grau de risco ponderado) --> gerado e salvo com sucesso!\n`);
		await pdfPorSetor(dadosEstruturadosSetorPdf, pastaSaida, `${nomeDaEmpresa}_Setores`, tipoRelatorio, introducaoGerencial, nomeDaEmpresa);
		console.log(`PDF Setores (Grau de risco ponderado) --> gerado e salvo com sucesso!\n`);

	} catch (error) {
		console.error(`Erro ao gerar PDFs: ${error.message}`);
	}
};
export { disponibilizarPDFGerencial };
