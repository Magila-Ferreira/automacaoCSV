import fs from 'fs';
import Papa from 'papaparse';
import xlsx from 'node-xlsx';

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
            console.error("Erro na leitura do CSV: ", resultado.errors);
            return [];
        }
        return resultado.data;

    // Leitura de arquivos Excel 
    } else if (filePath.endsWith('.xlsx')) {
        const conteudoExcel = xlsx.parse(filePath);

        if (conteudoExcel.length === 0 || conteudoExcel[0].data.length === 0) {
            console.error(`Arquivo VAZIO:    ${filePath}.`);
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

        return dados; 

    } else {
        console.error("Formato de arquivo inválido!");
        return [];
    };
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
// Preenche os campos vazios com "Não informado"
const tratarCamposVazios = (item) => {
    // Valor padrão dos atributos vazios
    const valorPadrao = {
        idade: 0,
        default: 'NÃO INFORMADO',
    };
    // Preencher os valores padrão
    Object.keys(item).forEach((key) => {
        // Tratamento para idade
        if (key === 'idade') {
            item[key] = parseInt(item[key], 10) || valorPadrao.idade;
        } else {
            item[key] = item[key] || valorPadrao.default;
        }
    });
    return item;
};
const processarArquivoEntrada = async (filePath) => {
    const dadosArquivo = processarArquivo(filePath); // Lê o arquivo e retorna os dados como objeto 
    if (dadosArquivo.length === 0) {
        throw new Error(`Arquivo VAZIO:     ${filePath}`);
    }    
    const dadosUnicos = filtrarRegistrosDublicados(dadosArquivo); // Desconsidera os registros duplicados no arquivo
    return dadosUnicos.map(tratarCamposVazios); // Trata os campos vazios
};
export { processarArquivoEntrada };