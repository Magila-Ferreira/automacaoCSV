import pacotePDF from 'pdfkit';
import fs from 'fs';
import path from 'path';

// Gerar arquivo PDF a partir dos dadosPDF selecionados
const gerarPDF = async (dadosPDF, pastaDestino, nomeArquivo) => {
	try {
		// Criar o arquivo PDF
		const pdf = new pacotePDF();

		// Caminho do arquivo PDF
		const caminhoArquivoPDF = path.join(pastaDestino, `${nomeArquivo}.pdf`);

		pdf.registerFont('Arial', './assets/fonts/arial.ttf');
		pdf.registerFont('Arial-Negrito', './assets/fonts/ARIALNB.TTF');

		// Criar o fluxo de escrita do PDF
		const fluxoEscrita = fs.createWriteStream(caminhoArquivoPDF);

		// Conectar o PDF ao fluxo de escrita
		pdf.pipe(fluxoEscrita);

		// Cabeçalho do PDF
		pdf.fontSize(16).fillColor('#55a').font('Arial-Negrito').text('RESULTADO DO QUESTIONÁRIO DE ANÁLISE PRELIMINAR DE RISCOS PSICOSSOCIAIS', { align: 'center' });
		espacamentoVertical(pdf, 2);

		// Iterar sobre cada fator
		for (let iFator = 1; iFator <= 10; iFator++) { 
			const dadosFator = dadosPDF[`fator_${iFator}`] ?? [];
			
			// Verificar se o fator possui dados
			if (dadosFator.length === 0) {
				console.warn(`O fator ${iFator} não possui dados. Pulando...`);
				continue; }

			dadosFator.forEach((avaliacao, index) => {
				if (index === 0) {
					const { escala, fator } = avaliacao;					
					espacamentoVertical(pdf, 1);

					// Título - ESCALA
					if ([1, 3, 5, 8].includes(iFator)) {
						pdf.fontSize(14).fillColor('#f00').font('Arial-Negrito').text(`${escala}`, { align: 'justify' });
					}

					// Título - FATOR
					espacamentoVertical(pdf, 1);
					pdf.fontSize(14).fillColor('black').font('Arial-Negrito').text(`${fator}`, { align: 'center' });
					espacamentoVertical(pdf, 1);
				}
			});

			let totalRespostas = 0;
			dadosFator.forEach((avaliacao) => {
				const conteudoResposta = avaliacao.resposta;
				const quantidadeResposta = avaliacao.quantidade;
				totalRespostas += quantidadeResposta;

				// Conteúdo do PDF
				pdf.fontSize(12).fillColor('black').font('Arial').text(`${conteudoResposta.charAt(0).toUpperCase() + conteudoResposta.slice(1).toLowerCase()} : ${quantidadeResposta} respostas`);
			});
			// Total de respostas por fator
			espacamentoVertical(pdf, 1);
			pdf.fontSize(12).text(`Total de ${totalRespostas} respostas`);
			espacamentoVertical(pdf, 1);
		};
		// Finaliza o PDF
		pdf.end();
		return caminhoArquivoPDF;
	} catch (error) {
		console.error(`Erro ao gerar PDF: ${error.message}`);
		throw error;
	}
};

const espacamentoVertical = (pdf, numLinhas) => {
	let espacamento = 0;
	do {
		pdf.moveDown();
		espacamento++;
	} while (espacamento < numLinhas);
};
export { gerarPDF, espacamentoVertical };
