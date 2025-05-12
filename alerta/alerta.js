import { exec } from 'child_process';

function alertarFimDoProcesso() {
	exec('schtasks /run /tn "MostrarAlertaPDF"', (err) => {
		if (err) {
			console.error('Erro ao chamar tarefa:', err);
		}
	});
}
export { alertarFimDoProcesso };