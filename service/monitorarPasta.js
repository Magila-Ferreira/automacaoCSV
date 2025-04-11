import chokidar from 'chokidar';
import path from 'path';
import { processarArquivoEntrada } from './lerArquivos.js';
import { salvarRegistrosNoBanco } from '../model/operacoesBanco.js';
import { disponibilizarPDF } from '../operacional/disponibilizarPDF.js';
import { disponibilizarPDFGerencial } from '../gerencial/disponibilizarPDFGerencial.js';
import { alertarFimDoProcesso } from './alertarUsuario.js';

// Verifica se o nome do banco é válido e o higieniza
const higienizaNomeDoBanco = (filePath) => {
	if (!filePath || typeof filePath !== "string" || !filePath.trim()) {
		return "analise_pgr"; // Nome padrão em caso de erro
	}

	let name = path.basename(filePath.trim(), path.extname(filePath.trim()));

	// Substituir caracteres inválidos e garantir um nome válido
	name = name.replace(/[^a-zA-Z0-9_]/g, "_").substring(0, 64) || "analise_pgr";
	return name;
};

// Verifica se o arquivo é válido:
const isArquivoValido = (filePath) => {
	return (
		!path.basename(filePath).startsWith('~$') // Se não for uma cópia temporária
		&& (filePath.endsWith('.csv') || filePath.endsWith('.xlsx')) // Se for csv ou xlsx
	);
};

const inicializarPrograma = () => {
	const pastaEntrada = path.resolve(process.cwd(), '..', 'arquivosPgr', 'excel_csv');
	const pastaSaida = path.resolve(process.cwd(), '..', 'arquivosPgr', 'pdf');

	// Define o nome das colunas (banco)
	const identificacaoCols = ['id', 'setor', 'cargo', 'idade', 'escolaridade', 'estadoCivil', 'genero']; // Tabela 'identificacao'
	const questao_respostaCols = Array.from({ length: 46 }, (_, i) => `q${i + 1}`); // Tabela 'questao_resposta'

	console.log("\n-----------------------------------------------------------------------------------------------\n");
	console.log("PROGRAMA INICIADO COM SUCESSO!!!");

	chokidar.watch(pastaEntrada, { persistent: true, ignored: /(^|[/\\])~\$.*/ }).on('add', async (filePath) => {
		const nomeDoBanco = higienizaNomeDoBanco(filePath); // Define o nome do banco (nome do arquivo ou nome padro)
		console.log("MONITORANDO PASTA...");

		try {
			if (!isArquivoValido(filePath)) return;
			console.log(`ARQUIVO VÁLIDO ENCONTRADO --> ${filePath}`);

			const dadosTratados = await processarArquivoEntrada(filePath);
			console.log("ARQUIVO PROCESSADO!\n");

			await salvarRegistrosNoBanco(dadosTratados, nomeDoBanco, identificacaoCols, questao_respostaCols);
			await disponibilizarPDF(nomeDoBanco, pastaSaida);
			await disponibilizarPDFGerencial(nomeDoBanco, pastaSaida);
		} catch (err) {
			console.error(`${err}\n`);
		}
		//alertarFimDoProcesso(pastaSaida); // FIM								
	});
	console.log("\n-----------------------------------------------------------------------------------------------\n");
};
export { inicializarPrograma };

