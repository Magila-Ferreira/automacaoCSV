import pacotePDF from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { espacamentoVertical } from './gerarPDF.js';

const gerarPDFSetores = async (dadosSetores, pastaDestino, nomeArquivo) => {
	try {
		const pdf = new pacotePDF();
		const caminhoArquivoPDF = path.join(pastaDestino, `${nomeArquivo}.pdf`);

		pdf.registerFont('Arial', './assets/fonts/arial.ttf');
		pdf.registerFont('Arial-Negrito', './assets/fonts/ARIALNB.TTF');

		const fluxoEscrita = fs.createWriteStream(caminhoArquivoPDF);
		pdf.pipe(fluxoEscrita);

		pdf.fontSize(16).fillColor('#55a').font('Arial-Negrito').text(
			'RESULTADO POR SETOR',
			{ align: 'center' }
		);
		espacamentoVertical(pdf, 2);

		for (const setor in dadosSetores) {
			pdf.addPage();
			pdf.fontSize(16).fillColor('#000').font('Arial-Negrito').text(`SETOR: ${setor}`, { align: 'center' });
			espacamentoVertical(pdf, 2);

			for (const escala in dadosSetores[setor]) {
				pdf.fontSize(14).fillColor('#f00').font('Arial-Negrito').text(escala, { align: 'justify' });
				espacamentoVertical(pdf, 1);

				for (const fator in dadosSetores[setor][escala]) {
					pdf.fontSize(14).fillColor('black').font('Arial-Negrito').text(fator, { align: 'center' });
					espacamentoVertical(pdf, 1);

					let totalRespostas = 0;
					dadosSetores[setor][escala][fator].forEach((avaliacao) => {
						const conteudoResposta = avaliacao.resposta;
						const quantidadeResposta = avaliacao.quantidade;
						totalRespostas += quantidadeResposta;

						pdf.fontSize(12).font('Arial').text(
							`${conteudoResposta.charAt(0).toUpperCase() + conteudoResposta.slice(1).toLowerCase()} : ${quantidadeResposta} respostas`
						);
					});

					espacamentoVertical(pdf, 1);
					pdf.fontSize(12).text(`Total de ${totalRespostas} respostas`);
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