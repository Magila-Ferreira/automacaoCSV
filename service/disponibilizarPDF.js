import path from 'path';

import { selecionarDadosPDF } from '../model/consultasBanco.js';
import { gerarPDF } from './gerarPDF.js';

// Agora podemos resolver o caminho de 'pastaSaida'
const pastaSaida = path.resolve(process.cwd(), '..', 'arquivosPgr', 'pdf');

const disponibilizarPDF = async (databaseName, colsResposta) => {
	const dadosPDF = await selecionarDadosPDF(databaseName); // 4. Selecionar os dados para gerar PDF
	
    if (dadosPDF.length === 0) {
        console.warn(`Nenhum dado disponível para gerar PDF. ARQUIVO: ${databaseName}`);
        return;
    }

    const pdf = await gerarPDF(dadosPDF, pastaSaida, databaseName); // 5. Gerar arquivo PDF
    console.log(`\nPDF gerado e salvo em: ${pdf}`);
    console.log("-----------------------------------------------------------------------------------------------");
};
export { disponibilizarPDF };