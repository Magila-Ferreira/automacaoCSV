import chokidar from 'chokidar';
import path from 'path';
import { processarArquivoEntrada } from './lerArquivos.js';
import { salvarRegistrosNoBanco } from '../model/operacoesBanco.js';
import { disponibilizarPDF } from '../operacional/disponibilizarPDF.js';
import { disponibilizarPDFGerencial } from '../gerencial/disponibilizarPDFGerencial.js';
import { alertarFimDoProcesso } from './alerta.js';

// Verifica se o nome do banco é válido e o higieniza
const higienizaNomeDoBancoEPDF = (filePath) => {
	if (!filePath || typeof filePath !== "string" || !filePath.trim()) {
		return "analise_pgr"; // Nome padrão em caso de erro
	}
	let nome = path.basename(filePath.trim(), path.extname(filePath.trim()));
	const ext = path.extname(filePath.trim()).replace('.', '_'); // Obtém a extensão e troca o ponto por "_"

	// Substituir caracteres inválidos e garantir um nome válido
	const nomeDoBanco = `${nome}${ext}`.replace(/[^a-zA-Z0-9_]/g, "_").substring(0, 64) || "analise_pgr";
	return { nomeDoBanco, nome };
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

	// Define o nome das colunas no banco - tabela 'identificacao'
	const identificacaoCols = ['id', 'setor', 'cargo', 'idade', 'escolaridade', 'estadoCivil', 'genero']; 
	
	// Cria um array com o nome das colunas do arquivo excel, para os dados que serão salvos na tabela 'questao_resposta'
	const colunasDasRespostasExcel = Array.from({ length: 46 }, (_, i) => `q${i + 1}`); 

	console.log("\n-----------------------------------------------------------------------------------------------\n");
	console.log("PROGRAMA INICIADO COM SUCESSO!!!");

	chokidar.watch(pastaEntrada, { persistent: true, ignored: /(^|[/\\])~\$.*/ }).on('add', async (filePath) => {
		const nomes = higienizaNomeDoBancoEPDF(filePath); // Define o nome do banco (nome do arquivo ou nome padro)
		const nomeDoBanco = nomes.nomeDoBanco;
		const nomeDaEmpresa = nomes.nome;
		console.log("MONITORANDO PASTA...");

		try {
			if (!isArquivoValido(filePath)) return;
			console.log(`ARQUIVO COM FORMATO VÁLIDO ENCONTRADO --> ${nomeDoBanco}\n`);

			const dadosTratados = await processarArquivoEntrada(filePath);
			console.log("ARQUIVO PROCESSADO!\n");

			await salvarRegistrosNoBanco(dadosTratados, nomeDoBanco, identificacaoCols, colunasDasRespostasExcel);
			await disponibilizarPDF(nomeDoBanco, pastaSaida, nomeDaEmpresa);
			await disponibilizarPDFGerencial(nomeDoBanco, pastaSaida, nomeDaEmpresa);
		} catch (err) {
			console.error(`${err}\n`);
		}
		alertarFimDoProcesso(pastaSaida); // FIM								
	});
	console.log("\n-----------------------------------------------------------------------------------------------\n");
};
export { inicializarPrograma };

