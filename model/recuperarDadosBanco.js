import { gerenciadorDeConexoesBD } from '../config/configBanco.js';
import { USUARIO_BD } from '../config/configBanco.js';

async function verificarSeOBancoExiste(nomeDoBanco) {
	/* try {
		const conexao = await mysql.createConnection({
			host: 'localhost',
			user: 'root',
			password: '0000'
		});

		const [rows] = await conexao.query('SHOW DATABASES LIKE ?', [nomeDoBanco]);
		await conexao.end();

		return rows.length > 0;
	} catch (err) {
		console.error(`[ERRO] Falha ao verificar existência do banco: ${err.message}`);
		return false;
	} */
	const db = gerenciadorDeConexoesBD(null, USUARIO_BD);
	
	try { 
		const [rows] = await db.query('SHOW DATABASES LIKE ?', [nomeDoBanco]);
		return rows.length > 0;
	} catch (err) {
		console.error(`[ERRO] Falha ao verificar existência do banco: ${err.message}`);
		return false;
	} finally {
		db.end();
	}
}
export { verificarSeOBancoExiste };
