import pacotePDF from 'pdfkit';
import fs from 'fs';
import sizeOf from "image-size";
import path from 'path';
import { gerarGrafico } from './gerarGraficos.js';
import { introducao } from '../conteudo/conteudoPDF.js';

// Gerar arquivo PDF a partir dos dadosPDF selecionados
const gerarPDF = async (dadosPDF, pastaDestino, nomeArquivo) => {
	try {
		// Criar o arquivo PDF
		const pdf = new pacotePDF({ size: 'A4' });

		// Caminho do arquivo PDF
		const caminhoArquivoPDF = path.join(pastaDestino, `${nomeArquivo}.pdf`);

		pdf.registerFont('Arial', './assets/fonts/arial.ttf');
		pdf.registerFont('Arial-Negrito', './assets/fonts/ARIALNB.TTF');

		// Criar o fluxo de escrita do PDF
		const fluxoEscrita = fs.createWriteStream(caminhoArquivoPDF);

		// Conectar o PDF ao fluxo de escrita
		pdf.pipe(fluxoEscrita);

		// Primeira página do PDF
		formatarPrimeiraPagina(pdf,
			'RESULTADO DA ANÁLISE PRELIMINAR DE RISCOS PSICOSSOCIAIS',
			'Empresa / Unidade Fabril:          ' + nomeArquivo.charAt(0).toUpperCase() + nomeArquivo.slice(1).toLowerCase(),
			introducao
		);

		// Iterar sobre cada fator
		for (let iFator = 1; iFator <= 10; iFator++) {
			const dadosFator = dadosPDF[`fator_${iFator}`] ?? [];

			// Verificar se o fator possui dados
			if (dadosFator.length === 0) {
				console.warn(`O fator ${iFator} não possui dados. Pulando...`);
				continue;
			}

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
			// Inserir gráficos do fator
			const localImagens = await gerarGrafico(dadosFator);

			// POSICIONAMENTO DO GRÁFICO
			let posicaoX = 50;
			let posicaoY = pdf.y + 10;

			for (const caminhoImagem of localImagens) {
				if (pdf.y > 600) {
					pdf.addPage();
					posicaoY = pdf.y; // Reinicia a posição Y na nova página
				}
				const dimensoes = sizeOf(caminhoImagem);
				const alturaImagem = dimensoes.height * (400 / dimensoes.width);

				pdf.image(caminhoImagem, posicaoX, posicaoY, { fit: [400, 600] });

				// Atualiza posição Y para o próximo elemento
				posicaoY += alturaImagem + 5; // Evita sobreposição
				pdf.y = posicaoY; // Atualiza pdf.y corretamente
			}
			
			// POSICIONAMENTO DO TEXTO
			formatarTextoSubTitulo(pdf, `INFORMAÇÕES DO GRÁFICO: `);
			let totalRespostas = 0;
			dadosFator.forEach((avaliacao) => {
				const conteudoResposta = avaliacao.resposta;
				const quantidadeResposta = avaliacao.quantidade;
				totalRespostas += quantidadeResposta;

				// Conteúdo do PDF
				formatarTextoConteudo(pdf, `${conteudoResposta.charAt(0).toUpperCase() + conteudoResposta.slice(1).toLowerCase()} : ${quantidadeResposta} respostas`);
			});
			// Total de respostas por fator
			formatarTextoEmDestaque(pdf, `TOTAL DE RESPOSTAS POR FATOR: ${totalRespostas}`);
		};
		// Finaliza o PDF
		pdf.end();
		return caminhoArquivoPDF;
	} catch (error) {
		console.error(`Erro ao gerar PDF: ${error.message}`);
		throw error;
	}
};
const formatarTextoEmDestaque = (pdf, destaque) => {
	espacamentoVertical(pdf, 1);
	pdf.fontSize(10).fillColor('#500').font('Arial-Negrito').text(destaque, { align: 'justify' });
};
const formatarTextoConteudo = (pdf, conteudo) => {
	pdf.fontSize(10).fillColor('#335').font('Arial').text(conteudo, { align: 'justify' });
};
const formatarTextoSubTitulo = (pdf, subtitulo) => {
	pdf.fontSize(10).fillColor('#000').font('Arial-Negrito').text(subtitulo, { width: 380, align: "justify" });
	espacamentoVertical(pdf, 1);
};
const formatarTextoEscala = (pdf, escala) => {
	pdf.fontSize(14).fillColor('#f00').font('Arial-Negrito').text(escala, { align: 'justify' });
	espacamentoVertical(pdf, 1);
};
const formatarTextoSetor = (pdf, setor) => {
	pdf.fontSize(14).fillColor('#555').font('Arial-Negrito').text(setor, { align: 'justify' });
};
const formatarPrimeiraPagina = (pdf, titulo = null, cabecalho = null, introducao = null) => {
	// TÍTULO
	pdf.fontSize(16).fillColor('#35a').font('Arial-Negrito').text(titulo, { align: 'center' });
	espacamentoVertical(pdf, 1);
	
	// CABEÇALHO DA EMPRESA
	pdf.fontSize(16).fillColor('#333').font('Arial-Negrito').text(cabecalho, { align: 'justify' });
	espacamentoVertical(pdf, 1);

	// TEXTO
	pdf.fontSize(12).fillColor('#555').font('Arial').text(introducao, { align: 'justify' });
}
const espacamentoVertical = (pdf, numLinhas) => {
	let espacamento = 0;
	do {
		pdf.moveDown();
		espacamento++;
	} while (espacamento < numLinhas);
};
export { gerarPDF, espacamentoVertical, formatarPrimeiraPagina, formatarTextoSetor, formatarTextoEscala, formatarTextoSubTitulo, formatarTextoConteudo, formatarTextoEmDestaque };
