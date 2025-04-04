const formatarTextoEmDestaque = (pdf, destaque) => {
	pdf.fontSize(10).fillColor('#500').font('Arial-Negrito').text(destaque, { align: 'justify' });
	espacamentoVertical(pdf, 3);
};
const formatarTextoConteudo = (pdf, conteudo) => {
	pdf.fontSize(10).fillColor('#335').font('Arial').text(conteudo, { align: 'justify' });
};
const formatarTextoSubTitulo = (pdf, subtitulo) => {
	pdf.fontSize(10).fillColor('#000').font('Arial-Negrito').text(subtitulo, { width: 380, align: "justify" });
};
const formatarTextoEscala = (pdf, escala) => {
	pdf.fontSize(14).fillColor('#f00').font('Arial-Negrito').text(escala, { align: 'justify' });
};
const formatarTextoSetor = (pdf, setor) => {
	pdf.fontSize(14).fillColor('#333').font('Arial-Negrito').text(setor, { align: 'justify' });
	espacamentoVertical(pdf, 1);
};
const formatarPrimeiraPagina = (pdf, titulo, definicao, cabecalho, introducao) => {
	// TÍTULO
	pdf.fontSize(16).fillColor('#35a').font('Arial-Negrito').text(titulo, { align: 'center' });

	// DEFINIÇÃO
	pdf.fontSize(16).fillColor('#000').font('Arial-Negrito').text(definicao, { align: 'center' });
	espacamentoVertical(pdf, 1);

	// CABEÇALHO DA EMPRESA
	pdf.fontSize(16).fillColor('#333').font('Arial-Negrito').text(cabecalho, { align: 'justify' });
	espacamentoVertical(pdf, 1);

	// TEXTO
	pdf.fontSize(11).fillColor('#555').font('Arial').text(introducao, { align: 'justify' });
}
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
		posicao.y = pdf.y; // Reinicia a posição Y na nova página
	}
	return posicao;
};
const atualizaPosicaoY = (pdf, posicao, altura) => {
	posicao.y += altura + 5; // Evita sobreposição
	pdf.y = posicao.y; // Atualiza pdf.y corretamente
};

export { espacamentoVertical, formatarPrimeiraPagina, formatarTextoSetor, formatarTextoEscala, formatarTextoSubTitulo, formatarTextoConteudo, formatarTextoEmDestaque, posicaoAtualPDF, definePosicao, atualizaPosicaoY };