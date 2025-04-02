import { criarPDF, adicionarGraficoAoPDF, adicionaInformacoesDoGrafico } from './gerarPDF.js';
import { formatarPrimeiraPagina, formatarTextoSetor, formatarTextoEscala, posicaoAtualPDF, definePosicao, espacamentoVertical } from './formatacaoPDF.js';
import { introducao } from '../conteudo/conteudoPDF.js';

const pdfPorSetor = async (dadosSetores, pastaDestino, nomeArquivo) => {
	try {
		const { pdf, caminhoArquivoPDF } = criarPDF(pastaDestino, nomeArquivo);
		formatarPrimeiraPagina(pdf, 'RESULTADO DA ANÁLISE PRELIMINAR DE RISCOS PSICOSSOCIAIS',
			'RELATÓRIO SETORIAL - DADOS SISTEMATIZADOS POR SETORES',
			'Empresa / Unidade Fabril:          ' + nomeArquivo.charAt(0).toUpperCase() + nomeArquivo.slice(1).toLowerCase(),
			introducao);
		
		for (const setor in dadosSetores) {
			pdf.addPage();
			formatarTextoSetor(pdf, `Setor de trabalho:                        ${setor.toUpperCase()}`);
			
			if (dadosSetores.length === 0) continue; // Verifica se o setor possui dados
			
			for (const escala in dadosSetores[setor]) {
				let posicao = posicaoAtualPDF(pdf);	// Posição atual do PDF
				posicao = definePosicao(pdf, 500, posicao);	// Define a posição de escrita da ESCALA
				formatarTextoEscala(pdf, escala);

				for (const fator in dadosSetores[setor][escala]) {
					posicao = await adicionarGraficoAoPDF(pdf, dadosSetores[setor][escala][fator], setor);
					await adicionaInformacoesDoGrafico(pdf, dadosSetores[setor][escala][fator], posicao);
					espacamentoVertical(pdf, 1);
				}
			}
		}
		pdf.end();
		return caminhoArquivoPDF;
	} catch (error) {
		throw error;
	}
};
export { pdfPorSetor };
