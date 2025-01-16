/* 1. Configuração do ambinete */
/* 2. Monitorar pasta e ler arquivo CSV */
const chokidar = require('chokidar');
const fs = require('fs');
const Papa = require('papaparse');

// Caminho da pasta PGR
const pastaPGR = 'E:/OneDrive/Documentos/arquivosPgr';

// Função para processar o CSV
const processarCSV = (filePath) => {
    const conteudo = fs.readFileSync(filePath, 'utf-8');
    const resultado = Papa.parse(conteudo, {
        header: true,
        skipEmptyLines: true,
    });

    console.log("Arquivo processado: ", resultado.data);
    return resultado.data;
};

// Monitorando a pasta
const watcher = chokidar.watch(pastaPGR, {persistent: true});

watcher.on('add', (filePath) => {
    console.log(`Novo arquivo detectado: ${filePath}`);
    const dados = processarCSV(filePath);
    console.log("Dados lidos: ", dados);
})

/* 3. Sistematização dos Dados */

// Salvá-los no banco de dados, primeiro.