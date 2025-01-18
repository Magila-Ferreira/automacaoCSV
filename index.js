/* 1. Configuração do ambinete */
/* 2. Monitorar pasta e ler arquivo CSV */
const chokidar = require('chokidar');
const fs = require('fs');
const Papa = require('papaparse');
const { salvarDadosCSV, recuperarDadosDoBanco } = require('./bd/models/csvModel');

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

    if (resultado.errors.length > 0) {
        console.error("Erro ao processar o CSV: ", resultado.errors);
        return [];
    }

    console.log("Dados processados: ", resultado.data);
    return resultado.data;
};

// Função para verificar registros novos
const filtrarNovosRegistros = (dadosCSV, dadosBanco) => {
    
    // Cria um conjunto de pares de id salvos no banco, para comparar ao csv
    const idsExistentes = new Set(
        dadosBanco.map(item => `${item.id}-${item.id_identificacao}`)
    );

    // Filtra os registros do csv 
    return dadosCSV.filter(item => {
        // Gera um identificador único para cada registro no CSV, com base nos dados relevantes
        const idProvisorio = `${item.setor}-${item.cargo}-${item.idade}-${item.escolaridade}-${item.estadoCivil}-${item.genero}`;
        
        // Verifica se o identificador_CSV está no conjunto de IDs existentes no banco de dados 
        return !idsExistentes.has(idProvisorio);
    });
};

// Monitorando a pasta
const watcher = chokidar.watch(pastaPGR, {persistent: true});
watcher.on('add', async (filePath) => {
    console.log(`Novo arquivo detectado: ${filePath}`);
    const dadosCSV = processarCSV(filePath);

    if (dadosCSV.length === 0) {
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
            const dadosBanco = await recuperarDadosDoBanco();

            // 2. Filtra os registros que ainda não estão no banco
            const novosRegistros = filtrarNovosRegistros(dadosCSV, dadosBanco);
            
            if (novosRegistros.length === 0) {
                console.log("Nenhum registro novo para salvar no banco.");
                return;    
            }

            // 3. Salva no banco os registros diferentes 
            const mensagem = await salvarDadosCSV(novosRegistros);
            console.log(mensagem);
    } catch (err) {
        console.error("Erro ao salvar os dados no bd: ", err);
    }

});

// REVISAR CÓDIGO COM BASE NO PROMPT: Explicação 3 - Duplicidade de registros.

/* 3. Sistematização dos Dados */

// Salvá-los no banco de dados, primeiro.