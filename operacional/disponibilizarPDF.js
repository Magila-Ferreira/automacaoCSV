import fs from 'fs';
import { introducaoOperacional } from '../conteudoEstatico/introducaoPDF.js';
import { selecionarDadosPDF, consultarSetores } from '../model/consultasBanco.js';
import { pdfDaEmpresa } from './pdfEmpresa.js';
import { pdfPorSetor } from './pdfSetor.js';
import { pdfAberto } from '../pdf/verificaStatusPdf.js';

// SLQ
/* ----------> Contabiliza as respostas da empresa, por fator <---------- */
const respostas_empresa = `
			SELECT e.nome AS escala, f.nome AS fator, qr.resposta, COUNT(*) AS quantidade
			FROM questao_resposta qr 
			JOIN questao q ON qr.id_questao = q.id
			JOIN fator f ON q.id_fator = f.id
			JOIN escala e ON f.id_escala = e.id
			WHERE q.id_fator = ?
			GROUP BY qr.resposta;`;
/* ----------> Contabiliza as respostas do setor, por fator <---------- */
const selecionar_setores = `SELECT DISTINCT setor FROM identificacao ORDER BY setor;`;
const respostas_setor = `
			SELECT e.nome AS escala, f.nome AS fator, qr.resposta, COUNT(*) AS quantidade
			FROM questao_resposta qr
			JOIN questao q ON qr.id_questao = q.id
			JOIN fator f ON q.id_fator = f.id
			JOIN escala e ON f.id_escala = e.id
			JOIN identificacao i ON qr.id_identificacao = i.id
			WHERE q.id_fator = ?
            AND i.setor = ?
			GROUP BY qr.resposta;`;

const disponibilizarPDF = async (nomeDoBanco, pastaSaida, nomeDaEmpresa) => {
	let tipoRelatorio = 'PORCENTAGEM DE RESPOSTAS';
	try {
		// Selecionar dados por empresa
		const dadosPDF = await selecionarDadosPDF(nomeDoBanco, respostas_empresa);

		// Selecionar os setores
		const setores = await consultarSetores(nomeDoBanco, selecionar_setores); // Objeto com chave
		const setoresDaEmpresa = setores.map((item) => item.setor); // Objeto sem chave (só o conteúdo)

		// Dados por cada setor
		const dadosPDF_porSetor = {};
		for (const setor of setoresDaEmpresa) {
			dadosPDF_porSetor[setor] = await selecionarDadosPDF(nomeDoBanco, respostas_setor, setor);
		}

		// Organizar os dados por setor 
		const dadosOrganizadosPorSetor = Object.entries(dadosPDF_porSetor).reduce((acumulador, [setor, fatores]) => {
			acumulador[setor] = {};

			Object.values(fatores).forEach((respostas) => {
				respostas.forEach(({ escala, fator, ...resto }) => {

					// Iniciar a escala e o fator, caso não existam
					acumulador[setor][escala] ??= {};
					acumulador[setor][escala][fator] ??= [];

					// Adicionar a resposta ao fator correspondente
					acumulador[setor][escala][fator].push({ escala, fator, ...resto });
				});
			});
			return acumulador;
		}, {});

		// Converter em um único array
		if (Object.keys(dadosOrganizadosPorSetor).length === 0) {
			console.warn("\nNenhum dado disponível para o PDF consolidado por setores.");
			return;
		}

		// Verificar se há dados para gerar o PDF
		const empresaSemDados = Object.values(dadosPDF).flat().length === 0;
		const setoresSemDados = Object.values(dadosPDF_porSetor).every(obj => Object.values(obj).flat().length === 0);
		if (empresaSemDados && setoresSemDados) {
			console.warn(`\nNenhum dado disponível para gerar PDF. ARQUIVO: ${nomeDoBanco}`);
			return;
		};

		// Verifica se o arquivo não está aberto, antes de gerar o PDF
		const caminhoCompletoEmpresa = `${pastaSaida}\\${nomeDaEmpresa}_Empresa - ${tipoRelatorio}.pdf`; 
		const caminhoCompletoSetores = `${pastaSaida}\\${nomeDaEmpresa}_Setores - ${tipoRelatorio}.pdf`; 
		while ((fs.existsSync(caminhoCompletoEmpresa) && await pdfAberto(caminhoCompletoEmpresa))
			|| (fs.existsSync(caminhoCompletoSetores) && await pdfAberto(caminhoCompletoSetores))) {
			console.log(`Arquivo(s) PDF em uso. Feche-o(s) para continuar...`);
			await new Promise(resolve => setTimeout(resolve, 10000)); // Espera 10 segundos
		} 
		// Gerar os PDF's da Empresa e por Setor
		await pdfDaEmpresa(dadosPDF, pastaSaida, `${nomeDaEmpresa}_Empresa`, tipoRelatorio, introducaoOperacional, nomeDaEmpresa);
		console.log(`PDF da Empresa (% de respostas) --> gerado e salvo com sucesso!\n`);
		await pdfPorSetor(dadosOrganizadosPorSetor, pastaSaida, `${nomeDaEmpresa}_Setores`, tipoRelatorio, introducaoOperacional, nomeDaEmpresa);
		console.log(`PDF por Setor (% de respostas) --> gerado e salvo com sucesso!\n`);
	} catch (error) {
		console.error(`Erro ao gerar PDFs: ${error.message}`);
	}
};
export { disponibilizarPDF };