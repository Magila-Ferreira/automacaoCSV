/* 2. Monitorar pasta de arquivos csv e xlsx */
const chokidar = require('chokidar');
const path = require('path');

const { 
    processarArquivo, 
    tratarCamposVazios, 
    filtrarRegistrosNovos, 
    filtrarRegistrosDublicados 
} = require('../services/lerArquivos');

const { 
    criarBancoEDefinirTabelas, 
    salvarDados, 
    recuperarDadosDoBanco 
} = require('../models/operacoesBanco');

// Pasta monitorada
const pastaPGR = 'E:/arquivosPgr';

// Monitorando a pasta
const inicializarPrograma = async () => { 
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

        const dadosUnicos = filtrarRegistrosDublicados(dadosArquivo,); // Remover registros duplicados no próprio arquivo
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
};

module.exports = { inicializarPrograma };