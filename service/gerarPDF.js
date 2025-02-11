import pacotePDF from 'pdfkit';
import fs from 'fs';
import path from 'path';

// Gerar arquivo PDF a partir dos dadosPDF selecionados
const gerarPDF = async (dadosPDF, pastaDestino, nomeArquivo) => {
    try {
        // Caminho do arquivo PDF
        const caminhoArquivoPDF = path.join(pastaDestino, `${nomeArquivo}.pdf`);

        // Criar o arquivo PDF
        const pdf = new pacotePDF();

        // Criar o fluxo de escrita do PDF
        const fluxoEscrita = fs.createWriteStream(caminhoArquivoPDF);

        // Conectar o PDF ao fluxo de escrita
        pdf.pipe(fluxoEscrita);

        // Criação do conteúdo do PDF
        pdf.fontSize(16).text('RESULTADO DO QUESTIONÁRIO DE ANÁLISE PRELIMINAR DE RISCOS PSICOSSOCIAIS', { align: 'center' });
		pdf.moveDown();

		dadosPDF.forEach((avaliacao, index) => {
        pdf.fontSize(12).text(`Avaliação PGR ${index + 1}`);
        pdf.text(`IDENTIFICADOR: ${avaliacao.identificador}`);
        pdf.text(`SETOR: ${avaliacao.setor}`);
        pdf.text(`FATOR: ${avaliacao.fator}`);
        pdf.text(`AFIRMATIVA: ${avaliacao.afirmativa}`);
		pdf.text(`RESPOSTA: ${avaliacao.resposta}`);
        pdf.moveDown();  
    });

    // Finaliza o PDF
    pdf.end();
    
    return caminhoArquivoPDF;

    }  catch (error) {        
        console.error(`Erro ao gerar PDF: ${error.message}`);
        throw error;
    }
};
export { gerarPDF };
