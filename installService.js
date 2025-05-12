import { Service } from 'node-windows';

// Criando um novo serviço
const svc = new Service({
	name: "AutomacaoNodeJS", // Nome do serviço no Windows
	description: "Processamento de arquivos excel e geração de gráficos em PDF",
	script: "C:\\amb_sw\\automacao\\index.js", // Caminho do seu script principal
	nodeOptions: [
		"--harmony",
		"--max_old_space_size=4096" // Ajuste para uso de memória se necessário
	],
	wait: 2,
	grow: 0.5,
	maxRetries: 3
});
// Evento de instalação bem-sucedida
svc.on("install", () => {
	console.log("Serviço instalado com sucesso!");
	svc.start(); // Inicia o serviço automaticamente após a instalação
});
// Instalando o serviço
svc.install();
