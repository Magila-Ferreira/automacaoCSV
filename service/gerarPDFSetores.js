import pacotePDF from 'pdfkit';
import fs from 'fs';
import sizeOf from "image-size";
import path from 'path';
import { introducao } from '../conteudo/conteudoPDF.js';
import { gerarGrafico } from './gerarGraficos.js';
import { espacamentoVertical, formatarPrimeiraPagina, formatarTextoSetor, formatarTextoEscala, formatarTextoSubTitulo, formatarTextoConteudo, formatarTextoEmDestaque } from './gerarPDF.js';

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

			// Verificar se o setor possui dados
			if (dadosSetores.length === 0) {
				console.warn(`O setor ${setor} não possui dados. Pulando...`);
				continue;
			}

			for (const escala in dadosSetores[setor]) {
				espacamentoVertical(pdf, 1);
				formatarTextoEscala(pdf, escala);

				for (const fator in dadosSetores[setor][escala]) {
					
					// Inserir gráficos do fator
					const localImagens = await gerarGrafico(dadosSetores[setor][escala][fator], dadosSetores[setor]);

					// POSICIONAMENTO DO GRÁFICO
					let posicaoX = 50;
					let posicaoY = pdf.y + 10;

					for (const caminhoImagem of localImagens) {
						if (pdf.y > 500) {
							pdf.addPage();
							posicaoY = pdf.y; // Reinicia a posição Y na nova página
						}
						const dimensoes = sizeOf(caminhoImagem);
						const alturaImagem = dimensoes.height * (400 / dimensoes.width);

						pdf.image(caminhoImagem, posicaoX, posicaoY, { fit: [400, 600] });

						// Atualiza posição Y para o próximo elemento
						posicaoY += alturaImagem + 5; // Evita sobreposição
						pdf.y = posicaoY; // Atualiza pdf.y corretamente
					
						// POSICIONAMENTO DO TEXTO
						if (pdf.y > 700) {
							pdf.addPage();
							posicaoY = pdf.y; // Reinicia a posição Y na nova página
						}
						formatarTextoSubTitulo(pdf, `INFORMAÇÕES DO GRÁFICO: `);
						let totalRespostas = 0;

						const ordemRespostas = ["nunca", "raramente", "às vezes", "frequentemente", "sempre"];

						// Ordenar os dados de acordo com essa ordem
						dadosSetores[setor][escala][fator].sort((primeira, segunda) => ordemRespostas.indexOf(primeira.resposta) - ordemRespostas.indexOf(segunda.resposta));

						dadosSetores[setor][escala][fator].forEach((avaliacao) => {
							const conteudoResposta = avaliacao.resposta;
							const quantidadeResposta = avaliacao.quantidade;
							totalRespostas += quantidadeResposta;

							formatarTextoConteudo(pdf, `${conteudoResposta.charAt(0).toUpperCase() + conteudoResposta.slice(1).toLowerCase()} : ${quantidadeResposta} respostas`);
						});
						formatarTextoEmDestaque(pdf, `TOTAL DE RESPOSTAS POR FATOR: ${totalRespostas}`);
						espacamentoVertical(pdf, 1);

						for (const caminhoImagem of localImagens) {
							if (fs.existsSync(caminhoImagem)) {
								fs.unlinkSync(caminhoImagem);
								console.log(`🗑️ Imagem deletada: ${caminhoImagem}`);
							}
						}
					}
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