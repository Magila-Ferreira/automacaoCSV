import fs from 'fs';
import Papa from 'papaparse';
import xlsx from 'node-xlsx';

const processarArquivo = async (filePath) => {
	try {
		// Determina o tipo de arquivo e processa de acordo
		if (filePath.endsWith('.csv')) {
			return await processarCSV(filePath);
		} else if (filePath.endsWith('.xlsx')) {
			return processarExcel(filePath);
		} else {
			console.error("Formato de arquivo inválido:", filePath);
			return [];
		}
	} catch (erro) {
		console.error("Erro ao processar arquivo:", erro.message);
		return [];
	}
};

// Função para processar arquivos CSV
const processarCSV = async (filePath) => {
	try {
		const conteudo = await fs.promises.readFile(filePath, 'utf-8');
		const resultado = Papa.parse(conteudo, {
			header: true,
			skipEmptyLines: true,
			delimiter: ';',
		});

		if (resultado.errors.length > 0) {
			console.error("Erro na leitura do CSV:", resultado.errors);
			return [];
		}
		return resultado.data;
	} catch (erro) {
		console.error("Erro ao ler CSV:", erro.message);
		return [];
	}
};

// Função para processar arquivos Excel
const processarExcel = (filePath) => {
	try {
		const conteudo = xlsx.parse(filePath);

		if (!conteudo.length || !conteudo[0].data.length) {
			console.error(`Arquivo VAZIO: ${filePath}.`);
			return [];
		}

		const [cabecalho, ...linhas] = conteudo[0].data;
		return linhas.map(linha => Object.fromEntries(cabecalho.map((coluna, index) => [coluna, linha[index] || null])));
	} catch (erro) {
		console.error("Erro ao ler Excel:", erro.message);
		return [];
	}
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
	const dadosArquivo = await processarArquivo(filePath); // Lê o arquivo e retorna os dados como objeto
	
	console.log(`Arquivo processado: ${dadosArquivo}`);

    if (dadosArquivo.length === 0) {
        throw new Error(`Arquivo VAZIO:     ${filePath}`);
	}
	
	// Se o arquivo Excel tiver ID, procedimento desnecessário
    const dadosUnicos = filtrarRegistrosDublicados(dadosArquivo); // Desconsidera os registros duplicados no arquivo
    return dadosUnicos.map(tratarCamposVazios); // Trata os campos vazios
};
export { processarArquivoEntrada };