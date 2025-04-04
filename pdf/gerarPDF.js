import pacotePDF from 'pdfkit';
import fs from 'fs';
import sizeOf from "image-size";
import path from 'path';
import { gerarGrafico } from '../service/gerarGraficos.js';
import { formatarTextoSubTitulo, formatarTextoConteudo, formatarTextoEmDestaque, posicaoAtualPDF, definePosicao, atualizaPosicaoY } from './formatacaoPDF.js';
import { normalizarRespostas } from '../normatizacao/respostas.js';

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
		await deletarImagens(caminhoImagem);
	}
	return posicao;
};

const adicionaInformacoesDoGrafico = async (pdf, dados, posicao) => {
	posicao = definePosicao(pdf, 750, posicao); // Define a posição do texto
	formatarTextoSubTitulo(pdf, `INFORMAÇÕES DO GRÁFICO (quantidade de respostas por categoria):`);

	let totalRespostas = 0;
	const respostasCompletas = normalizarRespostas(dados);

	// Itera sobre o conteúdo e quantidade das respostas completas
	respostasCompletas.forEach(({ resposta, quantidade }) => {
		totalRespostas += quantidade;
		formatarTextoConteudo(
			pdf,
			`${resposta.charAt(0).toUpperCase() + resposta.slice(1).toLowerCase()}: ${quantidade}`
		);
	});
	// Total de respostas por fator
	formatarTextoEmDestaque(pdf, `TOTAL DE RESPOSTAS POR FATOR: ${totalRespostas}`);
};

async function deletarImagens(caminhoImagem) {
	// Aguarda o PDF processar a imagem antes de excluir
	setImmediate(() => fs.unlink(caminhoImagem, (err) => {
		if (err) console.error(`Erro ao excluir a imagem ${caminhoImagem}:`, err);
	}));
}
export { criarPDF, adicionarGraficoAoPDF, adicionaInformacoesDoGrafico };