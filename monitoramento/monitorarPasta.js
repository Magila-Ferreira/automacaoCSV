const chokidar = require('chokidar');
const path = require('path');

const { processarArquivo, tratarCamposVazios, filtrarRegistrosNovos, filtrarRegistrosDublicados } = require('../servicos/lerArquivos');
const { criarBancoEDefinirTabelas, salvarDados, recuperarDadosDoBanco,selecionarDadosPDF } = require('../modelo/operacoesBanco');
const { gerarPDF } = require('../servicos/gerarPDF');

const pastaEntrada = 'E:/arquivosPgr/excel_csv';
const pastaSaida = 'E:/arquivosPgr/pdf';

// Verifica se o arquivo é válido:
const isArquivoValido = (filePath) => {
    return (
        !path.basename(filePath).startsWith('~$') // Se não for uma cópia temporária
        && (filePath.endsWith('.csv') || filePath.endsWith('.xlsx')) // Se for csv ou xlsx
    );
};

const processarArquivoEntrada = async (filePath) => {
    const dadosArquivo = processarArquivo(filePath); // Lê o arquivo e retorna os dados como objeto 
    if (dadosArquivo.length === 0) {
        throw new Error("Arquivo sem dados!");
    }

    const dadosUnicos = filtrarRegistrosDublicados(dadosArquivo); // Desconsidera os registros duplicados no arquivo
    return dadosUnicos.map(tratarCamposVazios); // Trata os campos vazios
};

const salvarRegistrosNoBanco = async (dadosTratados, databaseName, identificacaoCols, respostasCols) => {
    // Criar banco e tabelas
    await criarBancoEDefinirTabelas(databaseName, identificacaoCols, respostasCols);

    const dadosBanco = await recuperarDadosDoBanco(databaseName); // 1. Recupera os dados salvos no banco
    const novosRegistros = filtrarRegistrosNovos(dadosTratados, dadosBanco); // 2. Verifica se há registros nos arquivos diferentes dos registros do banco

    if (novosRegistros.length > 0) {
        await salvarDados(novosRegistros, databaseName); // 3. Salvando os novos registros
        console.log(`Dados salvos com sucesso no banco: ${databaseName}`);
    } else {
        console.log(`\n Sem novos registros para salvar no banco: ${databaseName}`);
    }

    return novosRegistros.length > 0;
};

const gerarEDisponibilizarPDF = async (databaseName, respostasCols) => {
    const dadosPDF = await selecionarDadosPDF(databaseName, respostasCols); // 4. Selecionar os dados para gerar PDF
    if (dadosPDF.length === 0) {
        console.warn("\n Nenhum dado disponível para gerar PDF.");
        return;
    }

    const pdf = await gerarPDF(dadosPDF, pastaSaida, databaseName); // 5. Gerar arquivo PDF
    console.log(`\n PDF gerado e salvo em: ${pdf}`);
};

const inicializarPrograma = () => {
    chokidar.watch(pastaEntrada, { persistent: true }).on('add', async (filePath) => {
        try {
            if (!isArquivoValido(filePath)) return;
            console.log(`\n Arquivo detectado: ${filePath}`);

            const dadosTratados = await processarArquivoEntrada(filePath);
            const databaseName = path.basename(filePath, path.extname(filePath)); // Define o nome do banco, conforme nome do arquivo sem extensão
            
            if (!databaseName) throw new Error("Nome inválido para o banco de dados.");

            const identificacaoCols = Object.keys(dadosTratados[0]).slice(0, 6); // Define nome das colunas da tabela 'identificacao'
            const respostasCols = Object.keys(dadosTratados[0]).slice(6); // Define nome das colunas da tabela 'respostas'

            await salvarRegistrosNoBanco(dadosTratados, databaseName, identificacaoCols, respostasCols);
            await gerarEDisponibilizarPDF(databaseName, respostasCols);

        } catch (err) {
            console.error("\n Erro ao processar arquivo:", err.message);
        }
    });
};

module.exports = { inicializarPrograma };
