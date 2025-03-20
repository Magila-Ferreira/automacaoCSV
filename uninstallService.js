import { Service } from 'node-windows';

const svc = new Service({
	name: "automacaonodejs.exe",
	script: "C:\\amb_teste\\servico_windows\\automacao\\index.js" // Caminho do script usado na instalação
});

svc.on("uninstall", () => {
	console.log("Serviço removido com sucesso!");
});

svc.uninstall();
