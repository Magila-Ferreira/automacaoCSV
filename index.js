/* 1. Configuração do ambinete */
/* 2. Monitorar pasta e ler arquivos */
const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const xlsx = require('node-xlsx');
const { criarBancoEDefinirTabelas, salvarDados, recuperarDadosDoBanco } = require('./bd/models/arquivoModel');

// Pasta monitorada
const pastaPGR = 'E:/arquivosPgr';

// Verifica quais dados dos arquivos não estão registrados no banco
const filtrarRegistrosNovos = (dadosArquivo, dadosBanco) => {
    
    // Converte os registros do banco em um Set de string JSON (para comparação)
    const registrosBanco = new Set(dadosBanco.map(item => `${item.setor?.trim()}-${item.cargo?.trim()}-${parseInt(item.idade, 10)}-${item.escolaridade?.trim()}-${item.estadoCivil?.trim()}-${item.genero?.trim()}`));

    // Filtra os dados que não estão no banco
    return dadosArquivo.filter(item => {
        const registroArquivo = `${item.setor?.trim()}-${item.cargo?.trim()}-${parseInt(item.idade, 10)}-${item.escolaridade?.trim()}-${item.estadoCivil?.trim()}-${item.genero?.trim()}`;

        return !registrosBanco.has(registroArquivo); // Retorna os registros que não estão no banco
    });
};

// Filtra os dados duplicados [se houver] no próprio arquivo, antes de tentar inserir no banco
const filtrarRegistrosDublicados = (dadosArquivo) => {
    const registrosUnicos = new Set();

    return dadosArquivo.filter(item => {

        // Armazena uma linha do arquivo
        const registro = `${item.setor?.trim()}-${item.cargo?.trim()}-${parseInt(item.idade, 10)}-${item.escolaridade?.trim()}-${item.estadoCivil?.trim()}-${item.genero?.trim()}`;

        if (registrosUnicos.has(registro)) {
            return false; // Ignora registro duplicado
        }

        registrosUnicos.add(registro); // Insere o registro em registrosUnicos
        return true;
    });
};

// Validação dos dados
const validarDados = (dados) => {
    
};

// Função para processar o arquivo
const processarArquivo = (filePath) => {

    // Leitura de arquivos CSV
    if (filePath.endsWith('.csv')) {
        const conteudo = fs.readFileSync(filePath, 'utf-8');
        const resultado = Papa.parse(conteudo, {
            header: true,
            skipEmptyLines: true,
            delimiter: ';',
        });

        if (resultado.errors.length > 0) {
            console.error("\n Erro na leitura do CSV: ", resultado.errors);
            return [];
        }

        console.log("\n Arquivo CSV lido com sucesso!");
        return resultado.data;

    // Leitura de arquivos Excel 
    } else if (filePath.endsWith('.xlsx')) {
        const conteudoExcel = xlsx.parse(filePath);

        if (conteudoExcel.length === 0 || conteudoExcel[0].data.length === 0) {
            console.error("\n Arquivo XLSX está VAZIO.");
            return [];
        }

        const cabecalho = conteudoExcel[0].data[0]; // Define a primeira linha como cabeçalho
        const linhas = conteudoExcel[0].data.slice(1); // Define as demais linhas como dados

        // Transforma as linhas do array dados em objetos
        const dados = linhas.map(linha => {
            const objetoDados = {}; // Cria um objeto vazio
            
            cabecalho.forEach((coluna, index) => { // Dispõe as linhas sob o cabeçalho
                objetoDados[coluna] = linha[index] || null; // Define a chave e o valor do objeto
            });
            return objetoDados; 
        });

        console.log("\n Arquivo XLSX lido com sucesso!");
        return dados; 

    } else {
        console.error("\n Formato de arquivo inválido.");
    };
};

// Monitorando a pasta
chokidar.watch(pastaPGR, {persistent: true}).on('add', async (filePath) => {
    if (path.basename(filePath).startsWith('~$')) return; // Ignora arquivos temporários do Excel

    // Verifica se há algum arquivo csv ou xlsx na pasta
    if (!filePath.endsWith('.csv') && !filePath.endsWith('.xlsx')) return;
    console.log(`\n Arquivo detectado: ${filePath}`);
    
    const dadosArquivo = processarArquivo(filePath);
    
    if (dadosArquivo.length === 0) {
        console.error("\n Arquivo sem dados!");
        return;
    }

    // Remover registros duplicados no próprio arquivo
    const dadosUnicos = filtrarRegistrosDublicados(dadosArquivo);

    // Preenche os campos vazios com "Não informado"
    const tratarCamposVazios = (item) => {
        item.setor = item.setor || "NAO INFORMADO";
        item.cargo = item.cargo || "NAO INFORMADO";
        item.idade = parseInt(item.idade, 10) || 0;
        item.escolaridade = item.escolaridade || "NAO INFORMADO";
        item.estadoCivil = item.estadoCivil || "NAO INFORMADO";
        item.genero = item.genero || "NAO INFORMADO";
        return item;
    };
        
    const dadosTratados = dadosUnicos.map(tratarCamposVazios); // Trata os campos vazios
    const databaseName = path.basename(filePath, path.extname(filePath)); // Define o nome do banco, conforme nome do arquivo sem extensão 

    if (!databaseName) {
        console.error("\n Nome inválido para o banco de dados.");
        return;
    }

    const identificacaoCols = Object.keys(dadosTratados[0]).slice(0, 6); // Define nome das colunas da tabela 'identificacao'
    const respostasCols = Object.keys(dadosTratados[0]).slice(6); // Define nome das colunas da tabela 'respostas'
    
    try {
        // Criar banco e tabelas
        await criarBancoEDefinirTabelas(databaseName, identificacaoCols, respostasCols);
        
        /* Verifica se há um novo registro nos arquivos, para salvá-los no banco */
            // 1. Recupera os dados salvos no banco
            const dadosBanco = await recuperarDadosDoBanco(databaseName);
                                    
            // 2. Verifica se há registros nos arquivos diferentes dos registros do banco 
            const novosRegistros = filtrarRegistrosNovos(dadosTratados, dadosBanco);
            
            // 3. Retorna se não houver registros novos
            if (novosRegistros.length === 0) {
                console.log(`\n Sem novos registros para salvar. ${databaseName}`);
                return; 
            } 

            // 4. Salvando os novos registros
            for (const registro of novosRegistros) {
                await salvarDados([registro], databaseName);
            }
            
            console.log(`\n Dados salvos com sucesso: ${databaseName}`);

    } catch (err) {
        console.error("\n Erro ao processar arquivos: ", err);
    }
});

/* 3. Sistematização dos Dados */