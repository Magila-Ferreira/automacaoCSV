import mysql from 'mysql2/promise';

async function verificarSeOBancoExiste(nomeDoBanco) {
	try {
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
	}
}
export { verificarSeOBancoExiste };
