import path from 'path';
import { selecionarDadosPDF } from '../model/consultasBanco.js';
import { gerarPDF } from './gerarPDF.js';
import { gerarPDFSetores } from './gerarPDFSetores.js';

// Agora podemos resolver o caminho de 'pastaSaida'
const pastaSaida = path.resolve(process.cwd(), '..', 'arquivosPgr', 'pdf');
// SLQ
/* ----------> Contabiliza as respostas da empresa, por fator <---------- */
const respostas_empresa = `
			SELECT e.nome AS escala, f.nome AS fator, qr.resposta, COUNT(*) AS quantidade
			FROM questao_resposta qr 
			JOIN questao q ON qr.id_questao = q.id
			JOIN fator f ON q.id_fator = f.id
			JOIN escala e ON f.id_escala = e.id
			WHERE q.id_fator = ?
			GROUP BY qr.resposta
			ORDER BY quantidade DESC;`;
/* ----------> Contabiliza as respostas do setor, por fator <---------- */
const respostas_setor = `
			SELECT e.nome AS escala, f.nome AS fator, qr.resposta, COUNT(*) AS quantidade
			FROM questao_resposta qr
			JOIN questao q ON qr.id_questao = q.id
			JOIN fator f ON q.id_fator = f.id
			JOIN escala e ON f.id_escala = e.id
			JOIN identificacao i ON qr.id_identificacao = i.id
			WHERE q.id_fator = ?
            AND i.setor = ?
			GROUP BY qr.resposta
			ORDER BY quantidade DESC;`;
const select_setores = `SELECT DISTINCT setor FROM identificacao ORDER BY setor;`;

const disponibilizarPDF = async (databaseName) => {
	try {
		// Selecionar dados por empresa
		const dadosPDF = await selecionarDadosPDF(databaseName, respostas_empresa); 

		// Selecionar os setores
		const setores = await selecionarDadosPDF(databaseName, select_setores);
		const setoresDaEmpresa = setores.map((item) => item.setor);	
				
		// Dados por cada setor
		const dadosPDF_porSetor = {};
		for (const setor of setoresDaEmpresa) {
			dadosPDF_porSetor[setor] = await selecionarDadosPDF(databaseName, respostas_setor, setor);
		}

		// Verificar se há dados para gerar o PDF
		const empresaSemDados = Object.values(dadosPDF).flat().length === 0; 
		const setoresSemDados = Object.values(dadosPDF_porSetor).every(obj => Object.values(obj).flat().length === 0);

		if (empresaSemDados && setoresSemDados) { 
			console.warn(`\nNenhum dado disponível para gerar PDF. ARQUIVO: ${databaseName}`);
			return;
		};

		// Gerar o PDF da empresa  
		const pdfEmpresa = await gerarPDF(dadosPDF, pastaSaida, databaseName); 
		console.log(`\nPDF da Empresa --> gerado e salvo em: ${pdfEmpresa}`);

		// Organizar os dados por setor ---------------------------------->>>>>>> VERIFICAR acc
		const dadosOrganizadosPorSetor = Object.entries(dadosPDF_porSetor).reduce((acc, [setor, fatores]) => {
			acc[setor] = {}; 
			Object.values(fatores).forEach((respostas) => {
				
				respostas.forEach((resposta) => {
					acc[setor][resposta.escala] ??= {};
					acc[setor][resposta.escala][resposta.fator] ??= [];
					acc[setor][resposta.escala][resposta.fator].push(resposta);
				});
			});
			return acc;
		}, {});

		// Converter em um único array
		if (Object.keys(dadosOrganizadosPorSetor).length === 0) {
			console.warn("\nNenhum dado disponível para o PDF consolidado por setores.");
			return;
		}

		// Gerar o PDF consolidado por setor
		const pdfSetores = await gerarPDFSetores(dadosOrganizadosPorSetor, pastaSaida, `${databaseName}_porSetores`);
		console.log(`\nPDF por setor --> gerado e salvo em: ${pdfSetores}`);

	} catch (error) {
		console.error(`Erro ao gerar PDFs: ${error.message}`);
	}
};
export { disponibilizarPDF };