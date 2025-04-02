import { criarPDF, adicionarGraficoAoPDF, adicionaInformacoesDoGrafico } from './gerarPDF.js';
import { formatarPrimeiraPagina, formatarTextoEscala } from './formatacaoPDF.js';
import { introducao } from '../conteudo/conteudoPDF.js';

const pdfDaEmpresa = async (dadosPDF, pastaDestino, nomeArquivo) => {
	try {
		const { pdf, caminhoArquivoPDF } = criarPDF(pastaDestino, nomeArquivo);
		formatarPrimeiraPagina(pdf, 'RESULTADO DA ANÁLISE PRELIMINAR DE RISCOS PSICOSSOCIAIS',
			'RELATÓRIO GERAL - POR EMPRESA',
			'Empresa / Unidade Fabril:          ' + nomeArquivo.charAt(0).toUpperCase() + nomeArquivo.slice(1).toLowerCase(),
			introducao);
		
		for (let iFator = 1; iFator <= 10; iFator++) {
			const dadosFator = dadosPDF[`fator_${iFator}`] ?? [];
			if (dadosFator.length === 0) continue;

			dadosFator.forEach((avaliacao, index) => {
				if (index === 0) {
					const { escala } = avaliacao;

					// Título - ESCALA
					if ([1, 3, 5, 8].includes(iFator)) {
						pdf.addPage();
						formatarTextoEscala(pdf, `${escala}`);
					}
				}
			});
			let posicao = await adicionarGraficoAoPDF(pdf, dadosFator);
			await adicionaInformacoesDoGrafico(pdf, dadosFator, posicao);
		}
		pdf.end();
		return caminhoArquivoPDF;
	} catch (error) {
		throw error;
	}
};
export { pdfDaEmpresa };