import fs from 'fs';

/**
 * Verifica se o arquivo existe e se está sendo usado (aberto)
 * @param {string} caminhoArquivo 
 * @returns {Promise<boolean>} true se estiver em uso
 */
async function pdfAberto(caminhoArquivo) {
	try {
		// Tenta renomear o arquivo temporariamente
		const tempPath = caminhoArquivo + '.tmp';
		fs.renameSync(caminhoArquivo, tempPath);
		fs.renameSync(tempPath, caminhoArquivo); // Renomeia de volta

		return false; // Se renomeou com sucesso, não está em uso
	} catch (err) {
		if (err.code === 'EPERM' || err.code === 'EBUSY') {
			return true; // Arquivo em uso
		}
		throw err; // Outro erro inesperado
	}
}
export { pdfAberto };
