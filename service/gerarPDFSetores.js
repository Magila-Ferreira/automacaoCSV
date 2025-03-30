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

		const fluxoEscrita = fs.createWriteStream(caminhoArquivoPDF);
		pdf.pipe(fluxoEscrita);

		// Primeira página do PDF
		formatarPrimeiraPagina(pdf,
			'RESULTADO DA ANÁLISE PRELIMINAR DE RISCOS PSICOSSOCIAIS',
			'RELATÓRIO SETORIAL - DADOS SISTEMATIZADOS POR SETORES',
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

						// Mapear as respostas existentes
						const mapaDeRespostasSetor = new Map(dadosSetores[setor][escala][fator].map(avaliacao => [
							avaliacao.resposta,
							avaliacao.quantidade
						]));

						// Adicionar respostas com quantidade 0
						const dadosCompletosSetor = ordemRespostas.map(resposta => ({
							resposta: resposta,
							quantidade: mapaDeRespostasSetor.get(resposta) || 0 // Retorna 0 se não houver valor
						})); 

						dadosCompletosSetor.forEach(({ resposta, quantidade }) => {
							totalRespostas += quantidade;

							formatarTextoConteudo(pdf, `${resposta.charAt(0).toUpperCase() + resposta.slice(1).toLowerCase()} : ${quantidade} respostas`);
						});
						formatarTextoEmDestaque(pdf, `TOTAL DE RESPOSTAS POR FATOR: ${totalRespostas}`);
						espacamentoVertical(pdf, 1);

						// Remover imagens temporárias (GRÁFICOS)
						for (const caminhoImagem of localImagens) {
							if (fs.existsSync(caminhoImagem)) {
								fs.unlinkSync(caminhoImagem);
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