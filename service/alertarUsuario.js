import notifier from 'node-notifier';
import path from 'path';
import { exec } from "child_process";

const alertarFimDoProcesso = (pastaSaida) => {
	notifier.notify({
		title: 'Processo Concluído!!!',
		message: 'O arquivo foi salvo e a pasta será aberta para visualização do arquivo.',
		icon: path.resolve(process.cwd(), 'assets', 'imagens', 'sistema', 'pdf_icon512.png'), // Caminho do ícone
		sound: true, // Reproduz um som
		wait: true, // Espera pela interação do usuário
		timeout: 5, // Tempo em segundos para o alerta desaparecer
		appID: 'NodeJS-Notificador' // Nome do "aplicativo" no sistema
	},
		(_, response) => { // Callback para verificar a resposta do usuário
			const pasta = path.resolve(pastaSaida); // Garante caminho absoluto
			exec(`explorer "${pasta}"`);
		}
	);
};
export { alertarFimDoProcesso };