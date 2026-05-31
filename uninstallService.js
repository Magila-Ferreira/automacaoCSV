import { Service } from 'node-windows';

//	"C:\\amb_sw\\automacao\\index.js" 			---> 			Caminho do script usado na instalação do Guilherme

const svc = new Service({
	name: "AutomacaoNodeJS",
	script: "E:\\DEV_2025\\automacao\\index.js" // Caminho do script usado na instalação
});

svc.on("uninstall", () => {
	console.log("Serviço removido com sucesso!");
});

svc.uninstall();
