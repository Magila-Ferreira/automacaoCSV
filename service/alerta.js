import notifier from 'node-notifier';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Simular __dirname com ESModules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function alertarFimDoProcesso(pastaSaida) {
	// Caminho dinâmico para o som (ex: ./recursos/sons/alerta.mp3)
	const caminhoSom = path.join(__dirname, '..', 'assets', 'sons', 'alerta.wav');
	const icone = path.join(__dirname, '..', 'assets', 'imagens', 'sistema', 'pdf_icon512.png'); 
	
	// 1. Exibir notificação (tipo balão do Windows)
	notifier.notify({
		title: 'Processo Finalizado',
		message: 'Arquivos PDF salvos! A pasta será aberta...',
		sound: caminhoSom,
		icon: icone,
		wait: false,
	});

	// 2. Verificar se a pasta existe antes de abrir
	if (fs.existsSync(pastaSaida)) {
		const comando = `explorer "${pastaSaida}"`;
		exec(comando, (err, stdout, stderr) => {
			if (err && err.code !== 1) {
				console.error('Erro real ao abrir a pasta:', err);
			}
			// Caso contrário, ignora o erro "falso" do explorer
		});
	} else {
		console.error('Pasta não encontrada:', pastaSaida);
	}
}

export { alertarFimDoProcesso };