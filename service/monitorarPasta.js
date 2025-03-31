import chokidar from 'chokidar';
import path from 'path';
import { processarArquivoEntrada } from './lerArquivos.js';
import { salvarRegistrosNoBanco } from '../model/operacoesBanco.js';
import { disponibilizarPDF } from './disponibilizarPDF.js';
import { alertarFimDoProcesso } from './alertarUsuario.js';

const pastaEntrada = path.resolve(process.cwd(), '..', 'arquivosPgr', 'excel_csv');
const pastaSaida = path.resolve(process.cwd(), '..', 'arquivosPgr', 'pdf');

// Verifica se o arquivo é válido:
const isArquivoValido = (filePath) => {
    return (
        !path.basename(filePath).startsWith('~$') // Se não for uma cópia temporária
        && (filePath.endsWith('.csv') || filePath.endsWith('.xlsx')) // Se for csv ou xlsx
    );
};
// Verifica compatibilidade entre as colunas do arquivo e as colunas da tabela 'identificacao'
const compativelBanco = (nomeSeisColunasArquivo) => {
    return (nomeSeisColunasArquivo.map(coluna => coluna.toLowerCase()).join('-') === 'setor-cargo-idade-escolaridade-estadocivil-genero');
};

const inicializarPrograma = () => {
    console.log("\n-----------------------------------------------------------------------------------------------\n");
    console.log("PROGRAMA INICIADO COM SUCESSO!!!");

    chokidar.watch(pastaEntrada, { persistent: true, ignored: /(^|[/\\])~\$.*/ }).on('add', async (filePath) => { 
        console.log("MONITORANDO PASTA...");
        
        try {
            if (!isArquivoValido(filePath)) return;
            console.log(`ARQUIVO VÁLIDO ENCONTRADO --> ${filePath}`);

            const dadosTratados = await processarArquivoEntrada(filePath);
            console.log("ARQUIVO PROCESSADO!\n");
            const databaseName = path.basename(filePath, path.extname(filePath)); // Define o nome do banco, conforme nome do arquivo sem extensão
            
            if (!databaseName) throw new Error("Nome inválido para o banco de dados.");

            // Define nome das colunas da tabela 'identificacao'
			const nomeSeisColunasArquivo = Object.keys(dadosTratados[0]).slice(0, 6);
			const identificacaoCols = nomeSeisColunasArquivo.map(coluna => coluna.toLowerCase()); // Converte para minúsculas

            // Verifica correspondência entre as colunas do arquivo e as colunas da tabela 'identificacao'
            if (!compativelBanco(nomeSeisColunasArquivo)) 
				return console.error(`As colunas do arquivo '${databaseName}' são incompatíveis com a tabela 'identificacao'.\n`);
			
			const nomeRestanteColunasArquivo = Object.keys(dadosTratados[0]).slice(6); 
            const colsResposta = nomeRestanteColunasArquivo.map(coluna => coluna.toLowerCase()); // Converte para minúsculas
			
			await salvarRegistrosNoBanco(dadosTratados, databaseName, identificacaoCols, colsResposta);
			await disponibilizarPDF(databaseName, pastaSaida);
        } catch (err) {
			console.error(`${err}\n`);
		}
		alertarFimDoProcesso(pastaSaida);
    });
    console.log("\n-----------------------------------------------------------------------------------------------\n");
};
export { inicializarPrograma };

