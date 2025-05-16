import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// config.js
export const NOME_BANCO_CONTROLE = 'controle_bancos';
export const USUARIO_BD = 'root';

const gerenciadorDeConexoesBD = (database, usuario) => {
	try {
		// Seleciona as credenciais com base no usuário
		const configUsuarios = {
			root: {
				host: process.env.DB_ROOT_HOST,
				user: process.env.DB_ROOT_USER,
				password: process.env.DB_ROOT_PASSWORD
			},
			adm: {
				host: process.env.DB_ADM_HOST,
				user: process.env.DB_ADM_USER,
				password: process.env.DB_ADM_PASSWORD
			},
			user: {
				host: process.env.DB_USER_HOST,
				user: process.env.DB_USER_USER,
				password: process.env.DB_USER_PASSWORD
			},
			readonly_user: {
				host: process.env.DB_READONLY_USER_HOST,
				user: process.env.DB_READONLY_USER_USER,
				password: process.env.DB_READONLY_USER_PASSWORD
			}
		};

		const credenciais = configUsuarios[usuario];
		return mysql.createPool({
			...credenciais,
			database,
			waitForConnections: true,
			connectionLimit: 10,
			queueLimit: 0,
		});
	} catch (error) {
		console.error(`Erro ao conectar ao banco: ${error.message}`);
		return null;
	}
};

export { gerenciadorDeConexoesBD }; 
