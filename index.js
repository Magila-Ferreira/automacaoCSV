/* 1. Configuração do ambinete */
/* 2. Monitorar pasta e ler arquivo CSV */
const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const { criarBancoEDefinirTabelas, salvarDadosCSV, recuperarDadosDoBanco } = require('./bd/models/csvModel');

// Pasta monitorada
const pastaPGR = 'E:/arquivosPgr';

// Verifica quais dados csv não estão registrados no banco
const filtrarNovosRegistros = (dadosCSV, dadosBanco) => {
    
    // Converte os registros do banco em um Set de string JSON (para comparação)
    const registrosBanco = new Set(dadosBanco.map(item => `${item.setor?.trim()}-${item.cargo?.trim()}-${parseInt(item.idade, 10)}-${item.escolaridade?.trim()}-${item.estadoCivil?.trim()}-${item.genero?.trim()}`));

    // Filtra os dados csv que não estão no banco
    return dadosCSV.filter(item => {
        const registroCSV = `${item.setor?.trim()}-${item.cargo?.trim()}-${parseInt(item.idade, 10)}-${item.escolaridade?.trim()}-${item.estadoCivil?.trim()}-${item.genero?.trim()}`;

        return !registrosBanco.has(registroCSV); // Não retorna os registros CSV que já estão no banco
    });
};

// Filtra os dados duplicados [se houver] no próprio CSV, antes de tentar inserir no banco
const filtrarRegistrosDublicadosCSV = (dadosCSV) => {
    const registrosUnicos = new Set();

    return dadosCSV.filter(item => {

        // Armazena uma linha do CSV
        const registro = `${item.setor?.trim()}-${item.cargo?.trim()}-${parseInt(item.idade, 10)}-${item.escolaridade?.trim()}-${item.estadoCivil?.trim()}-${item.genero?.trim()}`;

        if (registrosUnicos.has(registro)) {
            return false; // Ignora registro duplicado
        }

        registrosUnicos.add(registro); // Insere o registro em registrosUnicos
        return true;
    });
};

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

    console.log("Arquivo CSV lido com sucesso!");
    return resultado.data;
};

// Monitorando a pasta
chokidar.watch(pastaPGR, {persistent: true}).on('add', async (filePath) => {

    // Verifica se há algum arquivo csv na pasta
    if (!filePath.endsWith('.csv')) return;
    
    console.log(`Novo arquivo detectado: ${filePath}`);
    
    const dadosCSV = processarCSV(filePath);
    
    if (dadosCSV.length === 0) {
        console.error("Nenhum dado válido no arquivo CSV.");
        return;
    }

    // Remover registros duplicados no próprio CSV
    const dadosUnicosCSV = filtrarRegistrosDublicadosCSV(dadosCSV);

    const databaseName = path.basename(filePath, '.csv');   // Define nome do banco de dados de acordo com nome csv
    const identificacaoCols = Object.keys(dadosUnicosCSV[0]).slice(0, 6); // Define nome das colunas da tabela 'identificacao'
    const respostasCols = Object.keys(dadosUnicosCSV[0]).slice(6); // Define nome das colunas da tabela 'respostas'
    
    try {
        // Criar banco e tabelas
        await criarBancoEDefinirTabelas(databaseName, identificacaoCols, respostasCols);
        
        /* Verifica se há um novo registro no CSV, para salvá-lo no banco */
            // 1. Recupera os dados salvos no banco
            const dadosBanco = await recuperarDadosDoBanco(databaseName);
                                    
            // 2. Verifica se algum dos registro csv é diferente dos registros salvos no banco 
            const novosRegistros = filtrarNovosRegistros(dadosUnicosCSV, dadosBanco);
            
            // 3. Salva no banco os registros diferentes
            if (novosRegistros.length === 0) {
                console.log("Nenhum registro novo para salvar no banco.");
                return; 
            } 

            // 4. Salvando os novos registros
            for (const registro of novosRegistros) {
                await salvarDadosCSV([registro], databaseName);
            }
            
            console.log("Todos os dados foram salvos com sucesso no banco!");

    } catch (err) {
        console.error("Erro ao processar arquivo CSV: ", err);
    }
});


// Verificar valores nulos banco e csv --> Qual a tratativa???

/* 3. Sistematização dos Dados */


