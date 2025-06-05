// CONTEÚDO DA TABELA
const formatarLinhasTabela = (pdf, textoFator, risco, ausencia, xFator, xRisco, xAusencia, yLinha, cor) => { 
	pdf
		.fontSize(10)
		.font('Helvetica-Bold')
		.fillColor('#333')
		.text(textoFator, xFator, yLinha, { width: 180, lineBreak: false });
	pdf.
		fillColor(cor)
		.text(`${risco.toFixed(1)}%`, xRisco, yLinha, { lineBreak: false });
	
	pdf.fillColor('#333')
		.text(`${ausencia.toFixed(1)}%`, xAusencia, yLinha, { lineBreak: false });
};
const formatarLinhaDivisoriaTabela = (pdf, xFator) => { 
	pdf
		.moveTo(xFator, pdf.y)
		.lineTo(550, pdf.y)
		.strokeColor('#ccc')
		.lineWidth(1)
		.stroke();
};
const formatarCabecalhoTabela = (pdf, cabecalhoFator, cabecalhoRisco, cabecalhoAusencia, xFator, xRisco, xAusencia, yLinha) => { 
	pdf
		.fontSize(11)
		.font('Helvetica-Bold')
		.fillColor('#000')
		.text(cabecalhoFator, xFator, yLinha)
		.text(cabecalhoRisco, xRisco, yLinha)
		.text(cabecalhoAusencia, xAusencia, yLinha);
};	

// INFORMAÇÕES DO GRÁFICO 
const formatarTextoEmDestaque = (pdf, destaque) => {
	pdf.fontSize(10).fillColor('#500').font('Arial-Negrito').text(destaque, { align: 'justify' });
};
const formatarTextoConteudo = (pdf, conteudo) => {
	pdf.fontSize(10).fillColor('#333').font('Arial').text(conteudo, { align: 'justify' });
};
const formatarTextoSubTitulo = (pdf, subtitulo) => {
	pdf.fontSize(12).fillColor('#005').font('Helvetica-Bold').text(subtitulo, 50, pdf.y, { align: "justify" });
};

// CABEÇALHO DAS PÁGINAS
const formatarTextoEscala = (pdf, escala) => {
	espacamentoVertical(pdf, 0.5);
	pdf.fontSize(14).fillColor('#a00').font('Arial-Negrito').text(escala, { align: 'justify' });
};
const formatarTextoSetor = (pdf, setor) => {
	espacamentoVertical(pdf, 0.5);
	pdf.fontSize(14).fillColor('#333').font('Arial-Negrito').text(setor, { align: 'justify' });
};
const formatarDescricaoArquivo = (pdf, descricaoArquivo) => {
	pdf.fontSize(14).fillColor('#008').font('Arial-Negrito').text(descricaoArquivo, { align: 'center' });
};
const formatarPrimeiraPagina = (pdf, titulo, definicao, cabecalho, introducao) => {
	// Título
	pdf.fontSize(16).fillColor('#35a').font('Arial-Negrito').text(titulo, { align: 'center' });

	// Definição
	pdf.fontSize(16).fillColor('#000').font('Arial-Negrito').text(definicao, { align: 'center' });
	espacamentoVertical(pdf, 1);

	// Cabeçalho da empresa
	pdf.fontSize(16).fillColor('#333').font('Arial-Negrito').text(cabecalho, { align: 'justify' });
	espacamentoVertical(pdf, 1);

	// Texto
	pdf.fontSize(11).fillColor('#555').font('Arial').text(introducao, { align: 'justify' });
}

// ESPAÇAMENTOS
const espacamentoVertical = (pdf, numLinhas) => {
	let espacamento = 0;
	do {
		pdf.moveDown();
		espacamento++;
	} while (espacamento < numLinhas);
};
const posicaoAtualPDF = (pdf) => {
	let x = 50;
	let y = pdf.y + 10;
	return { x, y };
};
const definePosicao = (pdf, valor, posicao) => {
	if (pdf.y > valor) {
		pdf.addPage();
		posicao.y = 50; // Reinicia a posição Y na nova página
		posicao.x = 50; // Reinicia a posição X na nova página
	}
	return posicao;
};
const atualizaPosicaoY = (pdf, posicao, altura) => {
	posicao.y += altura + 5; // Evita sobreposição
	pdf.y = posicao.y; // Atualiza pdf.y corretamente
};
const garantirEspaco = (pdf, alturaNecessaria = 100, margemInferior = 50) => {
	if (pdf.y + alturaNecessaria > pdf.page.height - margemInferior) {
		pdf.addPage();
		pdf.y = 50; // ou qualquer margem superior padrão
	}
};
export { espacamentoVertical, formatarPrimeiraPagina, formatarTextoSetor, formatarTextoEscala, formatarTextoSubTitulo, formatarTextoConteudo, formatarTextoEmDestaque, posicaoAtualPDF, definePosicao, atualizaPosicaoY, garantirEspaco, formatarDescricaoArquivo, formatarCabecalhoTabela, formatarLinhaDivisoriaTabela, formatarLinhasTabela };