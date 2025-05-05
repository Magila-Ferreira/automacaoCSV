import { criarPDF, adicionarGrafico, adicionaInformacoesDoGraficoGerencial } from '../pdf/gerarPDF.js';
import { formatarPrimeiraPagina, formatarDescricaoArquivo } from '../pdf/formatacaoPDF.js';

const pdfDaEmpresa = async (dadosPDF, pastaDestino, nomeArquivo, tipoRelatorio, introducao, nomeDaEmpresa) => {
	try {
		const { pdf, caminhoArquivoPDF } = criarPDF(pastaDestino, nomeArquivo, tipoRelatorio);
		
		const titulo = 'RESULTADO DA ANÁLISE PRELIMINAR DE RISCOS PSICOSSOCIAIS';
		const definicao = `Relatório Gerencial - POR EMPRESA`;
		const cabecalho = 'Empresa / Unidade Fabril:          ' + nomeDaEmpresa.charAt(0).toUpperCase() + nomeDaEmpresa.slice(1).toLowerCase();
		const descricaoDoArquivo = "GRÁFICO GERENCIAL - Porcentagem de RISCO PSICOSSOCIAL por fator.";

		formatarPrimeiraPagina(pdf, titulo, definicao, cabecalho, introducao);

		formatarDescricaoArquivo(pdf, descricaoDoArquivo);

		// Itera sobre a chave 'escala'
		for (const [escala, dados] of Object.entries(dadosPDF)) { 
			// Verifica se a escala é válida
			if (!dados || dados.length === 0) continue;

			// Adiciona o gráfico
			let posicao = await adicionarGrafico(pdf, dados, null, tipoRelatorio);
			await adicionaInformacoesDoGraficoGerencial(pdf, dados, posicao);
		}			
		pdf.end();
		return caminhoArquivoPDF;
	} catch (error) {
		throw error;
	}
};
export { pdfDaEmpresa };