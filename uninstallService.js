import { Service } from 'node-windows';

const svc = new Service({
	name: "AutomacaoNodeJS",
	script: "C:\\amb_sw\\automacao\\index.js" // Caminho do script usado na instalação
});

svc.on("uninstall", () => {
	console.log("Serviço removido com sucesso!");
});

svc.uninstall();
