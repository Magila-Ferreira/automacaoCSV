import { criarPDF, adicionarGrafico, adicionaInformacoesDoGrafico } from '../pdf/gerarPDF.js';
import { formatarPrimeiraPagina, formatarTextoSetor, formatarTextoEscala, formatarDescricaoArquivo, posicaoAtualPDF, definePosicao, espacamentoVertical } from '../pdf/formatacaoPDF.js';

const pdfPorSetor = async (dadosSetores, pastaDestino, nomeArquivo, tipoRelatorio, introducao, nomeDaEmpresa) => {
	try {
		const { pdf, caminhoArquivoPDF } = criarPDF(pastaDestino, nomeArquivo, tipoRelatorio);
		const titulo = 'RESULTADO DA ANÁLISE PRELIMINAR DE RISCOS PSICOSSOCIAIS';
		const definicao = 'Relatório por setor';
		const cabecalho = 'Empresa / Unidade Fabril:          ' + nomeDaEmpresa.charAt(0).toUpperCase() + nomeDaEmpresa.slice(1).toLowerCase();
		const descricaoDoArquivo = "GRÁFICOS DO SETOR - Porcentagem de RESPOSTAS por categoria.";

		formatarPrimeiraPagina(pdf, titulo,
			definicao, cabecalho, introducao);

		for (const setor in dadosSetores) {
			pdf.addPage();
			formatarDescricaoArquivo(pdf, descricaoDoArquivo);
			formatarTextoSetor(pdf, `Setor de trabalho:                        ${setor.toUpperCase()}`);

			if (dadosSetores.length === 0) continue; // Verifica se o setor possui dados

			for (const escala in dadosSetores[setor]) {
				let posicao = posicaoAtualPDF(pdf);	// Posição atual do PDF
				posicao = definePosicao(pdf, 500, posicao);	// Define a posição de escrita da ESCALA
				formatarTextoEscala(pdf, escala);

				for (const fator in dadosSetores[setor][escala]) {
					posicao = await adicionarGrafico(pdf, dadosSetores[setor][escala][fator], setor, tipoRelatorio);
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
