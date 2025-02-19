import pacotePDF from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { espacamentoVertical, formatarPrimeiraPagina, formatarTextoSetor, formatarTextoEscala, formatarTextoSubTitulo, formatarTextoConteudo, formatarTextoEmDestaque } from './gerarPDF.js';
import { introducao } from '../conteudo/conteudoPDF.js';

const gerarPDFSetores = async (dadosSetores, pastaDestino, nomeArquivo) => {
	try {
		const pdf = new pacotePDF({ size: 'A4' });
		const caminhoArquivoPDF = path.join(pastaDestino, `${nomeArquivo}.pdf`);

		pdf.registerFont('Arial', './assets/fonts/arial.ttf');
		pdf.registerFont('Arial-Negrito', './assets/fonts/ARIALNB.TTF');

		// Insere imagem no PDF
		// -----	pdf.image('background.jpg', 0, 0, { width: doc.page.width, height: doc.page.height });

		// Define o tamanho do cabeçalho
		// -----	const alturaCabecalho = 200;

		// Definir cor de fundo
		// -----	pdf.rect(0, 0, pdf.page.width, alturaCabecalho).fill('#def');

		const fluxoEscrita = fs.createWriteStream(caminhoArquivoPDF);
		pdf.pipe(fluxoEscrita);

		// Primeira página do PDF
		formatarPrimeiraPagina(pdf,
			'RESULTADO DA ANÁLISE PRELIMINAR DE RISCOS PSICOSSOCIAIS',
			'Empresa / Unidade Fabril:          ' + nomeArquivo.charAt(0).toUpperCase() + nomeArquivo.slice(1).toLowerCase(),
			introducao
		);
		
		for (const setor in dadosSetores) {
			pdf.addPage();
			formatarTextoSetor(pdf, "Setor de trabalho:                        " + `${setor.toUpperCase()}`)

			for (const escala in dadosSetores[setor]) {
				espacamentoVertical(pdf, 1);
				formatarTextoEscala(pdf, escala);

				for (const fator in dadosSetores[setor][escala]) {
					formatarTextoSubTitulo(pdf, `INFORMAÇÕES DO GRÁFICO: `);
					let totalRespostas = 0;
					dadosSetores[setor][escala][fator].forEach((avaliacao) => {
						const conteudoResposta = avaliacao.resposta;
						const quantidadeResposta = avaliacao.quantidade;
						totalRespostas += quantidadeResposta;

						formatarTextoConteudo(pdf, `${conteudoResposta.charAt(0).toUpperCase() + conteudoResposta.slice(1).toLowerCase()} : ${quantidadeResposta} respostas`);
					});
					formatarTextoEmDestaque(pdf, `TOTAL DE RESPOSTAS POR FATOR: ${totalRespostas}`);
					espacamentoVertical(pdf, 1);
				}
			}
		}
		pdf.end();
		return caminhoArquivoPDF;
	} catch (error) {
		console.error(`Erro ao gerar PDF por setor: ${error.message}`);
		throw error;
	}
};
export { gerarPDFSetores };