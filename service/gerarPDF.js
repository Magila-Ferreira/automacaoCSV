import pacotePDF from 'pdfkit';
import fs from 'fs';
import sizeOf from "image-size";
import path from 'path';
import { gerarGrafico } from './gerarGraficos.js';
import { formatarTextoSubTitulo, formatarTextoConteudo, formatarTextoEmDestaque, posicaoAtualPDF, definePosicao, atualizaPosicaoY } from './formatacaoPDF.js';

const criarPDF = (pastaDestino, nomeArquivo) => {
	const pdf = new pacotePDF({ size: 'A4' });
	const caminhoArquivoPDF = path.join(pastaDestino, `${nomeArquivo}.pdf`);
	pdf.registerFont('Arial', './assets/fonts/arial.ttf');
	pdf.registerFont('Arial-Negrito', './assets/fonts/ARIALNB.TTF');
	const fluxoEscrita = fs.createWriteStream(caminhoArquivoPDF);
	pdf.pipe(fluxoEscrita);
	return { pdf, caminhoArquivoPDF };
};

const adicionarGraficoAoPDF = async (pdf, dados, setor = null) => {
	const localImagens = await gerarGrafico(dados, setor);
	let posicao = posicaoAtualPDF(pdf);
	
	for (const caminhoImagem of localImagens) {
		posicao = definePosicao(pdf, 500, posicao); // Define a posição da imagem
		const dimensoes = sizeOf(caminhoImagem); // Obtém dimensões da imagem
		const alturaImagem = dimensoes.height * (400 / dimensoes.width); // Calcula a altura da imagem
		pdf.image(caminhoImagem, posicao.x, posicao.y, { fit: [400, 600] }); // Insere imagem do gráfico
		atualizaPosicaoY(pdf, posicao, alturaImagem); 
		fs.unlinkSync(caminhoImagem); // Remove imagens
	}
	return posicao;
};

const adicionaInformacoesDoGrafico = async (pdf, dados, posicao) => {
	posicao = definePosicao(pdf, 750, posicao); // Define a posição do texto
	formatarTextoSubTitulo(pdf, `INFORMAÇÕES DO GRÁFICO (quantidade de respostas por categoria):`);
	
	let totalRespostas = 0;

	const ordemRespostas = ["nunca", "raramente", "às vezes", "frequentemente", "sempre"]; // Definir a ordem dos rótulos

	// Mapear as respostas existentes
	const mapaDeRespostas = new Map(dados.map(item => [
		item.resposta,
		item.quantidade
	]));

	// Adicionar respostas com quantidade 0
	const dadosCompletos = ordemRespostas.map(resposta => ({
		resposta: resposta,
		quantidade: mapaDeRespostas.get(resposta) || 0 // Retorna 0 se não houver valor
	}));

	// Itera sobre o conteúdo e quantidade das respostas completas
	dadosCompletos.forEach((avaliacao) => {
		const conteudoResposta = avaliacao.resposta;
		const quantidadeResposta = avaliacao.quantidade;
		totalRespostas += quantidadeResposta;

		// Conteúdo do PDF
		formatarTextoConteudo(pdf, `${conteudoResposta.charAt(0).toUpperCase() + conteudoResposta.slice(1).toLowerCase()}: ${quantidadeResposta}`);
	});
	// Total de respostas por fator
	formatarTextoEmDestaque(pdf, `TOTAL DE RESPOSTAS POR FATOR: ${totalRespostas}`);
};
export { criarPDF, adicionarGraficoAoPDF, adicionaInformacoesDoGrafico };