import pacotePDF from 'pdfkit';
import fs from 'fs';
import sizeOf from "image-size";
import path from 'path';
import { gerarGrafico } from '../operacional/gerarGraficos.js';
import { gerarGraficosGerenciais } from '../gerencial/gerarGraficosGerenciais.js';
import { formatarTextoSubTitulo, formatarTextoConteudo, formatarTextoEmDestaque, posicaoAtualPDF, definePosicao, atualizaPosicaoY } from './formatacaoPDF.js';
import { normalizarRespostas } from '../normatizacao/respostas.js';

const criarPDF = (pastaDestino, nomeArquivo, tipoRelatorio) => {
	const pdf = new pacotePDF({ size: 'A4' });
	const caminhoArquivoPDF = path.join(pastaDestino, `${nomeArquivo} - ${tipoRelatorio}.pdf`);
	pdf.registerFont('Arial', './assets/fonts/arial.ttf');
	pdf.registerFont('Arial-Negrito', './assets/fonts/ARIALNB.TTF');
	const fluxoEscrita = fs.createWriteStream(caminhoArquivoPDF);
	pdf.pipe(fluxoEscrita);
	return { pdf, caminhoArquivoPDF };
};
const adicionarGrafico = async (pdf, dados, setor = null, tipoRelatorio) => {
	let localImagens = [];
	
	if (tipoRelatorio === "RELATÓRIO DO GRAU DE RISCO PONDERADO") {
		localImagens = await gerarGraficosGerenciais(dados, setor);
	} else {
		localImagens = await gerarGrafico(dados, setor);
	}	
	let posicao = posicaoAtualPDF(pdf);

	for (const caminhoImagem of localImagens) {
		posicao = definePosicao(pdf, 500, posicao); // Define a posição da imagem
		const dimensoes = sizeOf(caminhoImagem); // Obtém dimensões da imagem
		const alturaImagem = dimensoes.height * (400 / dimensoes.width); // Calcula a altura da imagem
		pdf.image(caminhoImagem, posicao.x, posicao.y, { fit: [400, 700] }); // Insere imagem do gráfico
		atualizaPosicaoY(pdf, posicao, alturaImagem);
		deletarImagens(caminhoImagem);
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
const adicionaInformacoesDoGraficoGerencial = async (pdf, dados, posicao) => {
	posicao = definePosicao(pdf, 800, posicao); // Define a posição do texto
	formatarTextoSubTitulo(pdf, `INFORMAÇÕES DO GRÁFICO - porcentagem de risco psicossocial por fator:`);

	if (!Array.isArray(dados)) {
		console.error("ERRO: Esperava array, mas dados é:", typeof dados, dados);
		return;
	}

	// Itera sobre o conteúdo e quantidade das respostas completas
	dados.forEach(({ fator, porcentagem_risco }) => {
		formatarTextoConteudo(
			pdf,
			`${fator.charAt(0).toUpperCase() + fator.slice(1).toLowerCase()}: ${porcentagem_risco}%`
		);
	});
	atualizaPosicaoY(pdf, posicao, 70);
};
function deletarImagens(caminhoImagem) {
	// Aguarda o PDF processar a imagem antes de excluir
	fs.unlink(caminhoImagem, (err) => {
		if (err) console.error(`Erro ao excluir a imagem ${caminhoImagem}:`, err);
	});
}
export { criarPDF, adicionarGrafico, adicionaInformacoesDoGrafico, adicionaInformacoesDoGraficoGerencial };