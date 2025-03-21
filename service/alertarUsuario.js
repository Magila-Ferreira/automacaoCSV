import fs from "fs";
import path from "path";
import os from "os";

const alertarFimDoProcesso = (pastaDestino) => {
	//const caminhoDesktop = path.join(os.homedir(), "Desktop", "ALERTA_PDF_GERADO.txt");
	//const caminhoDesktop = path.join("E:\\OneDrive\\Desktop", "ALERTA_PDF_GERADO.txt");
	const caminhoDesktop = path.resolve(process.cwd(), '..', 'arquivosPgr', 'ALERTA_PDF_GERADO.txt');
	const mensagem = `Os arquivos PDF foram gerados com sucesso!\nDestino: ${pastaDestino}\n\nData: ${new Date().toLocaleString()}`;

	fs.writeFileSync(caminhoDesktop, mensagem, "utf-8");
	console.log("✅ Arquivo de alerta criado na pasta de trabalho: arquivosPgr");
};
export { alertarFimDoProcesso };