import cron from 'node-cron';
import { limparBancosAntigos } from '../model/operacoesBanco.js';

export function agendarLimpezaMensal() {
	// Executa todo dia 1º do mês às 12:00
	cron.schedule('0 12 1 * *', async () => {
		await limparBancosAntigos();
		console.log('[CRON] Executando limpeza mensal de bancos antigos...');
	});
}
