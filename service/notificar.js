import notifier from "node-notifier";

try {
	notifier.notify({
		title: "AutomacaoNodeJS",
		message: "Os arquivos PDF foram criados com sucesso!",
		sound: true,
		wait: false,
	});
} catch (error) { 
	console.log("\n Erro ao enviar notificação: ", error);
}

