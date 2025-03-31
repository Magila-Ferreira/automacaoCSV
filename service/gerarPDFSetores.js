import pacotePDF from 'pdfkit';
import fs from 'fs';
import sizeOf from "image-size";
import path from 'path';
import { introducao } from '../conteudo/conteudoPDF.js';
import { gerarGrafico } from './gerarGraficos.js';
import { espacamentoVertical, formatarPrimeiraPagina, formatarTextoSetor, formatarTextoEscala, formatarTextoSubTitulo, formatarTextoConteudo, formatarTextoEmDestaque, posicaoAtualPDF, definePosicao, atualizaPosicaoY } from './gerarPDF.js';

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
				let posicao = posicaoAtualPDF(pdf);	// Posição atual do PDF
				posicao = definePosicao(pdf, 500, posicao);	// Define a posição de escrita da ESCALA
				
				formatarTextoEscala(pdf, escala);

				for (const fator in dadosSetores[setor][escala]) {
					// Inserir gráficos do fator
					const localImagens = await gerarGrafico(dadosSetores[setor][escala][fator], dadosSetores[setor]);

					// Verifica a posição de escrita do arquivo - antes do GRÁFICO
					posicao = posicaoAtualPDF(pdf);
					
					for (const caminhoImagem of localImagens) {
						// Reinicia o posicionamento, se necessário, para caber o GRÁFICO
						posicao = definePosicao(pdf, 500, posicao);
						
						const dimensoes = sizeOf(caminhoImagem);
						const alturaImagem = dimensoes.height * (400 / dimensoes.width);

						pdf.image(caminhoImagem, posicao.x, posicao.y, { fit: [400, 600] });

						// Atualiza a posição Y após o gráfico
						atualizaPosicaoY(pdf, posicao, alturaImagem);
					
						// POSICIONAMENTO DO TEXTO
						posicao = definePosicao(pdf, 750, posicao);

						formatarTextoSubTitulo(pdf, `INFORMAÇÕES DO GRÁFICO (quantidade de respostas por categoria):`);
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

							formatarTextoConteudo(pdf, `${resposta.charAt(0).toUpperCase() + resposta.slice(1).toLowerCase()}: ${quantidade}`);
						});
						formatarTextoEmDestaque(pdf, `TOTAL DE RESPOSTAS POR SETOR/FATOR: ${totalRespostas}`);
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
