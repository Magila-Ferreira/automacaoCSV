/* 1. Configuração do ambinete */
/* 2. Monitorar pasta e ler arquivo CSV */
const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const { criarBancoEDefinirTabelas, salvarDadosCSV } = require('./bd/models/csvModel');

// Pasta monitorada
const pastaPGR = 'E:\arquivosPgr';

// Função para processar o CSV
const processarCSV = (filePath) => {
    const conteudo = fs.readFileSync(filePath, 'utf-8');
    const resultado = Papa.parse(conteudo, {
        header: true,
        skipEmptyLines: true,
        delimiter: ';',
    });

    if (resultado.errors.length > 0) {
        console.error("Erro ao processar o CSV: ", resultado.errors);
        return [];
    }

    //console.log("Dados processados: ", resultado.data);
    return resultado.data;
};

// Monitorando a pasta
chokidar.watch(pastaPGR, {persistent: true}).on('add', async (filePath) => {
    if (!filePath.endsWith('.csv')) return;
    
    console.log(`Novo arquivo detectado: ${filePath}`);
    
    const dadosCSV = processarCSV(filePath);

    if (dadosCSV.length === 0) {
        console.error("Nenhum dado válido foi encontrado no arquivo CSV.");
        return;
    }

    const databaseName = path.basename(filePath, '.csv');   // Define nome do banco de dados de acordo com nome csv
    const identificacaoCols = Object.keys(dadosCSV[0]).slice(0, 6); // Define nome das colunas da tabela 'identificacao'
    const respostasCols = Object.keys(dadosCSV[0]).slice(6); // Define nome das colunas da tabela 'respostas'

    try {
        // Criar banco e tabelas
        await criarBancoEDefinirTabelas(databaseName, identificacaoCols, respostasCols);
        await salvarDadosCSV(dadosCSV, databaseName);

    } catch (error) {
        console.error("Erro ao processar arquivo CSV: ", error.message);
    }
});

// Erro causado no banco com o id_resposta. Verificar com o chat: Explicação 3

/* 3. Sistematização dos Dados */

