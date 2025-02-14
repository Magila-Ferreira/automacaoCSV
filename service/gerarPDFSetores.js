import pacotePDF from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { espacamentoVertical, formatarTitulo, formatarTextoCabecalho, formatarTextoEscala, formatarTextoFator, formatarTextoConteudo } from './gerarPDF.js';

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

		// Cabeçalho do PDF
		formatarTitulo(pdf, 'RESULTADO DA ANÁLISE PRELIMINAR DE RISCOS PSICOSSOCIAIS');
		
		for (const setor in dadosSetores) {
			formatarTextoCabecalho(pdf, 'Empresa / Unidade Fabril:          ' + nomeArquivo.charAt(0).toUpperCase() + nomeArquivo.slice(1).toLowerCase());
			formatarTextoCabecalho(pdf, "Setor de trabalho:                        " + `${setor.toUpperCase()}`)

			for (const escala in dadosSetores[setor]) {
				formatarTextoEscala(pdf, escala);

				for (const fator in dadosSetores[setor][escala]) {
					formatarTextoFator(pdf, fator);

					let totalRespostas = 0;
					dadosSetores[setor][escala][fator].forEach((avaliacao) => {
						const conteudoResposta = avaliacao.resposta;
						const quantidadeResposta = avaliacao.quantidade;
						totalRespostas += quantidadeResposta;

						formatarTextoConteudo(pdf, `${conteudoResposta.charAt(0).toUpperCase() + conteudoResposta.slice(1).toLowerCase()} : ${quantidadeResposta} respostas`);
					});

					espacamentoVertical(pdf, 1);
					formatarTextoConteudo(pdf, `Total de ${totalRespostas} respostas`);
					espacamentoVertical(pdf, 1);
				}
			}
			// Verifica se o setor é diferente do último
			if (setor !== Object.keys(dadosSetores)[Object.keys(dadosSetores).length - 1]) {
				pdf.addPage(); // Iniciar o setor na próxima página
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