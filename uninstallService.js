import { Service } from 'node-windows';

// Criar o serviço com o mesmo nome usado na instalação
const svc = new Service({
	name: "AutomacaoNodeJS"
});

// Verificar se o serviço está instalado antes de remover
svc.on("uninstall", () => {
	console.log("Serviço removido com sucesso!");
});

svc.on("alreadyuninstalled", () => {
	console.log("O serviço já estava desinstalado.");
});

// Executa a desinstalação
svc.uninstall();
