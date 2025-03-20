import { Service } from 'node-windows';

const svc = new Service({
	name: "AutomacaoNodeJS"
});

svc.on("uninstall", () => {
	console.log("Serviço removido com sucesso!");
});

svc.uninstall();
