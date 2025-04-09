import { introducaoOperacional } from '../conteudoEstatico/introducaoPDF.js';
import { selecionarDadosPDF } from '../model/consultasBanco.js';
import { pdfDaEmpresa } from './pdfEmpresa.js';
import { pdfPorSetor } from './pdfSetor.js';

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
const selecionar_setores = `SELECT DISTINCT setor FROM identificacao ORDER BY setor;`;

const disponibilizarPDF = async (nomeDoBanco, pastaSaida) => {
	let tipoRelatorio = 'RELATÓRIO OPERACIONAL';
	try {
		// Selecionar dados por empresa
		const dadosPDF = await selecionarDadosPDF(nomeDoBanco, respostas_empresa);

		// Selecionar os setores
		const setores = await selecionarDadosPDF(nomeDoBanco, selecionar_setores); // Objeto com chave
		const setoresDaEmpresa = setores.map((item) => item.setor); // Objeto sem chave (só o conteúdo)

		// Dados por cada setor
		const dadosPDF_porSetor = {};
		for (const setor of setoresDaEmpresa) {
			dadosPDF_porSetor[setor] = await selecionarDadosPDF(nomeDoBanco, respostas_setor, setor);
		}

		// Verificar se há dados para gerar o PDF
		const empresaSemDados = Object.values(dadosPDF).flat().length === 0;
		const setoresSemDados = Object.values(dadosPDF_porSetor).every(obj => Object.values(obj).flat().length === 0);

		if (empresaSemDados && setoresSemDados) {
			console.warn(`\nNenhum dado disponível para gerar PDF. ARQUIVO: ${nomeDoBanco}`);
			return;
		};

		// Gerar o PDF da empresa  
		const pdfEmpresa = await pdfDaEmpresa(dadosPDF, pastaSaida, `${nomeDoBanco}_Empresa`, tipoRelatorio, introducaoOperacional);
		console.log(`PDF (Operacional) da Empresa --> gerado e salvo em: ${pdfEmpresa} \n`);

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

		// Gerar o PDF consolidado por setor
		const pdfSetor = await pdfPorSetor(dadosOrganizadosPorSetor, pastaSaida, `${nomeDoBanco}_Setores`, tipoRelatorio, introducaoOperacional);
		console.log(`PDF (Operacional) por setor --> gerado e salvo em: ${pdfSetor}\n`);
	} catch (error) {
		console.error(`Erro ao gerar PDFs: ${error.message}`);
	}
};
export { disponibilizarPDF };