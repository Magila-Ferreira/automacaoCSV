import { gerenciadorDeConexoesBD } from '../config/configBanco.js';

// Recupera os registros do banco
const recuperarDadosDoBanco = async (database) => {
    const db = gerenciadorDeConexoesBD(database);
    try {
        const select_dados_identificacao = `
            SELECT setor, cargo, idade, escolaridade, estadoCivil, genero 
            FROM identificacao`;

        const [rows] = await db.query(select_dados_identificacao);       

        if (!rows || rows.length === 0) {
            return [];
        }
        return rows.map(row => ({
            setor: row.setor?.trim(),
            cargo: row.cargo?.trim(),
            idade: parseInt(row.idade, 10),
            escolaridade: row.escolaridade?.trim(),
            estadoCivil: row.estadoCivil?.trim(),
            genero: row.genero?.trim(),           
        }));
    } catch (error) {
        console.error(`Erro ao recuperar dados: ${error.message}`);
        return [];
    } finally {
        db.end();
    }
}
// Verifica quais dados do arquivo não estão registrados no banco
const filtrarRegistrosNovos = (dadosArquivo, dadosBanco) => {
    
    // Converte os registros do banco em um Set de string JSON (para comparação)
    const registrosBanco = new Set(dadosBanco.map(item => `${item.setor?.trim()}-${item.cargo?.trim()}-${parseInt(item.idade, 10)}-${item.escolaridade?.trim()}-${item.estadoCivil?.trim()}-${item.genero?.trim()}`));

    // Filtra os dados que não estão no banco
    return dadosArquivo.filter(item => {
        const registroArquivo = `${item.setor?.trim()}-${item.cargo?.trim()}-${parseInt(item.idade, 10)}-${item.escolaridade?.trim()}-${item.estadoCivil?.trim()}-${item.genero?.trim()}`;

        return !registrosBanco.has(registroArquivo); // Retorna os registros que não estão no banco
    });
};
// Seleciona os dados do banco para salvar no PDF
const selecionarDadosPDF = async (database, nomeDasColunasNaTabelaRespostas) => {
    const db = gerenciadorDeConexoesBD(database);
    
    try {
        if (nomeDasColunasNaTabelaRespostas.length === 0) {
            console.warn("Colunas não encontradas na tabela 'respostas'!");
            return [];
        }
        // SQL com colunas dinâmicas para a tabela respostas  
        const select_dados_pdf = `
            SELECT i.setor, i.cargo, i.idade, i.escolaridade, i.estadoCivil, i.genero, r.id 
                AS id_resposta, ${nomeDasColunasNaTabelaRespostas.map((coluna) => `r.${coluna}`).join(', ')} 
            FROM identificacao i
            LEFT JOIN respostas r ON i.id = r.id_identificacao`;

        const [rows] = await db.query(select_dados_pdf);       

        if (!rows || rows.length === 0) {
            console.warn("Não há dados para gerar o PDF!");
            return [];
        }
        // Inclusão dinâmica dos resultados
        return rows.map(row => ({
            setor: row.setor,
            cargo: row.cargo,
            idade: parseInt(row.idade, 10),
            escolaridade: row.escolaridade,
            estadoCivil: row.estadoCivil,
            genero: row.genero,
            respostas: nomeDasColunasNaTabelaRespostas.reduce((colDinamicas, coluna) => {
                colDinamicas[coluna] = row[coluna];
                return colDinamicas;
            }, {})
    }));
    } catch (error) {
        console.error(`Erro ao selecionar dados para gerar PDF: ${error.message}`);
        return [];
    } finally {
        db.end();
    }
}
export { filtrarRegistrosNovos, recuperarDadosDoBanco, selecionarDadosPDF };