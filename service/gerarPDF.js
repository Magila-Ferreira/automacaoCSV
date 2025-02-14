import pacotePDF from 'pdfkit';
import fs from 'fs';
import path from 'path';

// Gerar arquivo PDF a partir dos dadosPDF selecionados
const gerarPDF = async (dadosPDF, pastaDestino, nomeArquivo) => {
	try {
		// Criar o arquivo PDF
		const pdf = new pacotePDF({ size: 'A4' });

		// Caminho do arquivo PDF
		const caminhoArquivoPDF = path.join(pastaDestino, `${nomeArquivo}.pdf`);

		pdf.registerFont('Arial', './assets/fonts/arial.ttf');
		pdf.registerFont('Arial-Negrito', './assets/fonts/ARIALNB.TTF');

		// Insere imagem no PDF
		// -----	pdf.image('background.jpg', 0, 0, { width: doc.page.width, height: doc.page.height });

		// Define o tamanho do cabeçalho
		// -----	const alturaCabecalho = 200;

		// Definir cor de fundo
		// -----	pdf.rect(0, 0, pdf.page.width, alturaCabecalho).fill('#def');

		// Criar o fluxo de escrita do PDF
		const fluxoEscrita = fs.createWriteStream(caminhoArquivoPDF);

		// Conectar o PDF ao fluxo de escrita
		pdf.pipe(fluxoEscrita);

		// Cabeçalho do PDF
		formatarTitulo(pdf, 'RESULTADO DA ANÁLISE PRELIMINAR DE RISCOS PSICOSSOCIAIS');
		formatarTextoCabecalho(pdf, 'Empresa / Unidade Fabril:          ' + nomeArquivo.charAt(0).toUpperCase() + nomeArquivo.slice(1).toLowerCase());

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
					
					// Título - ESCALA
					if ([1, 3, 5, 8].includes(iFator)) {
						formatarTextoEscala(pdf, `${escala}`);
					}

					// Título - FATOR
					formatarTextoFator(pdf, `${fator}`);
				}
			});

			let totalRespostas = 0;
			dadosFator.forEach((avaliacao) => {
				const conteudoResposta = avaliacao.resposta;
				const quantidadeResposta = avaliacao.quantidade;
				totalRespostas += quantidadeResposta;

				// Conteúdo do PDF
				formatarTextoConteudo(pdf, `${conteudoResposta.charAt(0).toUpperCase() + conteudoResposta.slice(1).toLowerCase()} : ${quantidadeResposta} respostas`);
			});
			// Total de respostas por fator
			espacamentoVertical(pdf, 1);
			formatarTextoConteudo(pdf, `Total de ${totalRespostas} respostas`);
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
const formatarTextoConteudo = (pdf, texto) => {
	pdf.fontSize(12).fillColor('#000').font('Arial').text(texto, { align: 'justify'});
}
const formatarTextoFator = (pdf, texto) => {
	espacamentoVertical(pdf, 1);
	pdf.fontSize(14).fillColor('#000').font('Arial-Negrito').text(texto, { align: 'center' });
	espacamentoVertical(pdf, 1);
} 
const formatarTextoEscala = (pdf, texto) => {
	espacamentoVertical(pdf, 2);
	pdf.fontSize(14).fillColor('#f00').font('Arial-Negrito').text(texto, { align: 'justify' });
	espacamentoVertical(pdf, 1);
};
const formatarTextoCabecalho = (pdf, texto) => {
	pdf.fontSize(14).fillColor('#555').font('Arial-Negrito').text(texto, { align: 'justify' });
}
const formatarTitulo = (pdf, texto) => {
	pdf.fontSize(16).fillColor('#35a').font('Arial-Negrito').text(texto, { align: 'center' });
	espacamentoVertical(pdf, 1);
}
const espacamentoVertical = (pdf, numLinhas) => {
	let espacamento = 0;
	do {
		pdf.moveDown();
		espacamento++;
	} while (espacamento < numLinhas);
};
export { gerarPDF, espacamentoVertical, formatarTitulo, formatarTextoCabecalho, formatarTextoEscala, formatarTextoFator, formatarTextoConteudo };
