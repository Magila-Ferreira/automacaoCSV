import { selecionarDadosGerenciais, selecionarDadosGerenciaisPDF, consultarSetores } from "../model/consultasBanco.js";
import { pesos } from "../conteudoEstatico/insertsEstaticos.js";
import { pdfDaEmpresa, pdfPorSetor } from "./pdfGerencialEmpresa.js";
import { introducaoGerencial } from "../conteudoEstatico/introducaoPDF.js";
import { normalizarDadosEmpresa, normalizarDadosSetor, agruparDadosPorSetor, estruturaDadosPorSetor } from "../normatizacao/dadosGerenciais.js";
import { salvarRegistrosGerenciais, salvarRegistrosGerenciaisSetor } from "../model/operacoesBanco.js";

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
async function acrescentaPorcentagem(dadosGerenciais) {
	// Seção: porcentagem ponderada por questão em dadosGerenciais
	const dadosGerenciaisQuestao = [];

	// Função para processar uma questão e calcular porcentagens
	const processaQuestao = (idQuestao, questao) => {

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
	};

	// Detecta se os dados estão agrupados por setor
	const primeiraChave = Object.keys(dadosGerenciais)[0];
	const primeiroValor = dadosGerenciais[primeiraChave];
	const isAgrupadoPorSetor = typeof primeiroValor === 'object' && !('respostas' in primeiroValor);

	// Normaliza estrutura para [ [idQuestao, questao], ... ]
	let questoesNormalizadas = [];

	if (isAgrupadoPorSetor) {
		// Desmembra os dados por setor e agrupa todas as questões em um único array
		Object.values(dadosGerenciais).forEach(questoesSetor => {
			questoesNormalizadas.push(...Object.entries(questoesSetor));
		});
	} else {
		// Já está no formato esperado
		questoesNormalizadas = Object.entries(dadosGerenciais);
	}

	// Processa todas as questões
	questoesNormalizadas.forEach(([idQuestao, questao]) => {
		processaQuestao(idQuestao, questao);
	});

	return dadosGerenciaisQuestao;
}
// Função principal que decide como processar os dados recebidos
async function calcularRiscoEmpresaOuSetor(dadosGerenciais) {
	if (!dadosGerenciais) return {};

	if (Array.isArray(dadosGerenciais)) {
		if (dadosGerenciais.length > 0
			&& typeof dadosGerenciais[0].setor === 'string'
			&& dadosGerenciais[0].setor.trim() !== "") {
			
			// Caso seja dadosGerenciaisSetor (tem setor)
			return calcularRiscoPorSetor(dadosGerenciais);
		} else {
			// Caso seja dadosGerenciais (não tem setor)
			return calcularRiscoPorEmpresa(dadosGerenciais);
		}
	}
	// Se não for array (por segurança), retorna vazio
	return {};
}
// Para dados da empresa (sem setor): agrupa por fator
function calcularRiscoPorEmpresa(respostas) {
	const agrupadoPorFator = {};

	respostas.forEach((item) => {
		const fator = item.fator;

		if (!agrupadoPorFator[fator]) {
			agrupadoPorFator[fator] = {
				respostas: [],
				risco: null
			};
		}
		agrupadoPorFator[fator].respostas.push(item);
	});

	for (const fator in agrupadoPorFator) {
		agrupadoPorFator[fator].risco = calcularRisco(agrupadoPorFator[fator].respostas);
	}

	return agrupadoPorFator;
}
// Para dados com setor: agrupa por setor > fator
function calcularRiscoPorSetor(respostasComSetor) {
	const agrupadoPorSetor = {};

	respostasComSetor.forEach(resposta => {
		const { setor, fator } = resposta;

		if (!agrupadoPorSetor[setor]) {
			agrupadoPorSetor[setor] = {};
		}

		if (!agrupadoPorSetor[setor][fator]) {
			agrupadoPorSetor[setor][fator] = {
				respostas: [],
				risco: null
			};
		}

		agrupadoPorSetor[setor][fator].respostas.push(resposta);
	});

	for (const setor in agrupadoPorSetor) {
		for (const fator in agrupadoPorSetor[setor]) {
			agrupadoPorSetor[setor][fator].risco = calcularRisco(agrupadoPorSetor[setor][fator].respostas);
		}
	}
	return agrupadoPorSetor;
}
// Função utilitária para calcular o risco
function calcularRisco(respostas) {
	const respostasPorQuestao = {};

	// Desestruturação das respostas 
	respostas.forEach(({ questao, peso, porcentagem }) => {
		if (!respostasPorQuestao[questao]) {
			respostasPorQuestao[questao] = [];
		}
		// Realocação dos pesos e porcentagens na questão (não em cada resposta)
		respostasPorQuestao[questao].push({ peso, porcentagem });
	});

	// Soma das porcentagens com peso 1 e 2 em cada questão
	const somasPorQuestao = Object.values(respostasPorQuestao).map(respostasDaQuestao => {
		return respostasDaQuestao
			.filter(resposta => resposta.peso === 1 || resposta.peso === 2) // Filtra as respostas com peso 1 ou 2
			.reduce((total, { porcentagem }) => total + parseFloat(porcentagem), 0); // Soma as porcentagens das respostas filtradas
	});

	// Total de questões no fator
	const totalQuestoes = somasPorQuestao.length;

	if (totalQuestoes === 0) {
		return 0;
	}

	// Cálculo da média de risco ponderada: soma as porcentagens com peso 1 e 2 e divide pelo total de questões
	const media = somasPorQuestao.reduce((total, valor) => total + valor, 0) / totalQuestoes;

	return Number(media.toFixed(3));
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
		dadosGerenciaisEmpresa = await acrescentaPorcentagem(dadosGerenciaisEmpresa); // Calcula porcentagem		
		dadosGerenciaisEmpresa = await calcularRiscoEmpresaOuSetor(dadosGerenciaisEmpresa); // Calcula o risco por fator

		dadosGerenciaisSetor = await acrescentaPesosEPonderacao(dadosGerenciaisSetor); // Calcula ponderação		
		dadosGerenciaisSetor = await agruparDadosPorSetor(dadosGerenciaisSetor); // Agrupa os dados por setor
		dadosGerenciaisSetor = await acrescentaPorcentagem(dadosGerenciaisSetor); // Calcula porcentagem
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

		// Gerar o PDF's Grau de risco ponderado 'Empresa' e 'Setor'
		await pdfDaEmpresa(dadosEmpresaPdf, pastaSaida, `${nomeDaEmpresa}_Empresa`, tipoRelatorio, introducaoGerencial, nomeDaEmpresa);
		console.log(`PDF da Empresa (Grau de risco ponderado) --> gerado e salvo com sucesso!\n`);
		await pdfPorSetor(dadosEstruturadosSetorPdf, pastaSaida, `${nomeDaEmpresa}_Setores`, tipoRelatorio, introducaoGerencial, nomeDaEmpresa);
		console.log(`PDF Setores (Grau de risco ponderado) --> gerado e salvo com sucesso!\n`);

	} catch (error) {
		console.error(`Erro ao gerar PDFs: ${error.message}`);
	}
};
export { disponibilizarPDFGerencial };
