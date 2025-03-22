import { exec } from "child_process";

const alertarFimDoProcesso = () => {
	// 1. Alerta de notificação
	exec('schtasks /run /tn "ALERTA_AutomacaoNodeJS"', (error, stdout, stderr) => {
		if (error) {
			console.error(`Erro ao executar notificação: ${error.message}`);
		}
	});
};
export { alertarFimDoProcesso };