/* 1. Configuração do ambinete */
/* 2. Monitorar pasta e ler arquivo CSV */
const chokidar = require('chokidar');
const fs = require('fs');
const Papa = require('papaparse');
const { salvarDadosCSV } = require('./bd/models/csvModel');

// Caminho da pasta PGR
const pastaPGR = 'E:/OneDrive/Documentos/arquivosPgr';

// Função para processar o CSV
const processarCSV = (filePath) => {
    const conteudo = fs.readFileSync(filePath, 'utf-8');
    const resultado = Papa.parse(conteudo, {
        header: true,
        skipEmptyLines: true,
        delimiter: ';',
    });

    console.log("Dados processados: ", resultado.data);
    return resultado.data;
};

// Monitorando a pasta
const watcher = chokidar.watch(pastaPGR, {persistent: true});

watcher.on('add', async (filePath) => {
    console.log(`Novo arquivo detectado: ${filePath}`);
    const dados = processarCSV(filePath);

    if (dados.length === 0) {
        console.error("Nenhum dado válido foi encontrado no csv.");
        return;
    }
    
    try {
        // Limpar espaços em branco e aspas dos valores
        const dadosLinha = {};
        for (const key in filePath) {
            dadosLinha[key.trim()] = filePath[key].trim();
        }

        /* Verifica se há um novo registro no CSV, para salvá-lo no banco */
            // 1. Recupera os dados salvos no banco
            
            // 2. Verifica se algum registro de dadosLinha é diferente dos registros salvos no banco 

            // 3. Salva no banco os registros diferentes 
            const mensagem = await salvarDadosCSV(dados);
            console.log(mensagem);
    } catch (err) {
        console.error("Erro ao salvar os dados no bd: ", err);
    }

});

/* 3. Sistematização dos Dados */

// Salvá-los no banco de dados, primeiro.