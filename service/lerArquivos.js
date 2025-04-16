import fs from 'fs';
import Papa from 'papaparse';
import xlsx from 'node-xlsx';

const processarArquivo = async (filePath) => {
	try {
		// Determina o tipo de arquivo e processá-lo
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
			console.error("Erro no processamento do CSV:", resultado.errors);
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

// Limpar conteúdo do objeto dadosArquivo
const formatarChave = (chave) => {
	return chave
		.trim()                      // Remove espaços extras no início e fim
		.toLowerCase()               // Converte para minúsculas
		.replace(/[:]/g, '')         // Remove ":" caso exista
		.replace(/\s+/g, '_');       // Substitui espaços por "_"
};

const limparDados = (dados) => {
	return dados.map(item => {
		let novoObjeto = {};

		Object.keys(item).forEach(chave => {
			const novaChave = formatarChave(chave);  // Renomeia a chave

			let valor = item[chave];

			// Tratamento de valores antes de salvar no banco
			if (typeof valor === 'string') {
				valor = valor.trim();  // Remove espaços extras
				if (valor === '') valor = "NÃO INFORMADO";  // Converte strings vazias para default
			}

			// Conversão de números
			if (!isNaN(valor) && valor !== null) {
				valor = parseInt(valor);  // Converte para número int
			}
			novoObjeto[novaChave] = valor;
		});
		return novoObjeto;
	});
};

// Selecionar as colunas para as tabelas: 'identificacao' e 'questao_resposta'
function selecionarColunasEFormatarDados(dadosLimpos) {
	return dadosLimpos.map(dadoLimpo => {
		// Renomear chaves
		let dadosSelecionados = {
			id: dadoLimpo.id,
			setor: dadoLimpo.setor_de_trabalho,
			cargo: dadoLimpo.cargo_atual,
			idade: dadoLimpo.idade,
			escolaridade: dadoLimpo.escolaridade,
			estadoCivil: dadoLimpo.estado_civil,
			genero: dadoLimpo['como_você_se_identifica'],
		};
		// Renomeando as perguntas para q1, q2, ..., q46
		const chavesOriginais = Object.keys(dadoLimpo); // Obtém o nome das chaves do objeto dadosLimpos
		const indiceInicialChaves = chavesOriginais.indexOf('como_você_se_identifica') + 1; // Obtém a posição de q1

		// Percorre as chaves e adiciona ao novo objeto, renomeando-as
		chavesOriginais.slice(indiceInicialChaves).forEach((chave, index) => {
			dadosSelecionados[`q${index + 1}`] = dadoLimpo[chave];
		});
		return dadosSelecionados;
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
		const chaveEmMinusculas = key.toLowerCase();

        // Tratamento para idade
        if (chaveEmMinusculas === 'idade') {
            item[key] = parseInt(item[key], 10) || valorPadrao.idade;
		} else {
			//if (item[key] === null) item[key] = valorPadrao.default;
            item[key] = item[key] || valorPadrao.default;
        }
	});
    return item;
};
const processarArquivoEntrada = async (filePath) => {
	const dadosArquivo = await processarArquivo(filePath); // Lê o arquivo e retorna os dados como objeto
	if (dadosArquivo.length === 0) throw new Error(`\t\t\t ARQUIVO VAZIO --> ${filePath}`);
	const dadosLimpos = limparDados(dadosArquivo);	// Higienização dos dados
	const dadosSelecionados = await selecionarColunasEFormatarDados(dadosLimpos); // Seleciona os dados para: 'identificacao' e 'questao_resposta' 
    return dadosSelecionados.map(tratarCamposVazios); // Trata os campos vazios
};
export { processarArquivoEntrada };