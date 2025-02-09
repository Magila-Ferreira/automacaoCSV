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
        pdf.fontSize(16).text('Relatório de Avaliações', { align: 'center' });
        pdf.moveDown();

        dadosPDF.forEach((avaliacao, index) => {
        pdf.fontSize(12).text(`Avaliação PGR ${index + 1}`);
        pdf.text(`Setor: ${avaliacao.setor}`);
        pdf.text(`Cargo: ${avaliacao.cargo}`);
        pdf.text(`Idade: ${avaliacao.idade}`);
        pdf.text(`Escolaridade: ${avaliacao.escolaridade}`);
        pdf.text(`Estado Civil: ${avaliacao.estadoCivil}`);
        pdf.text(`Gênero: ${avaliacao.genero}`);

        const respostas = Object.entries(avaliacao.respostas)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');

        pdf.text(`Respostas: ${respostas}`);
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
