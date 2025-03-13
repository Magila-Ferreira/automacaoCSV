import { exec } from 'child_process';

const alertarFimDoProcesso = (pastaDestino) => {
	const mensagem = `echo. && echo Arquivos PDF gerados com sucesso! && echo. && echo Destino dos arquivos: ${pastaDestino} && echo. && echo Pressione ENTER para fechar a janela... && pause >nul && exit`;
	
	exec(`start cmd /k "${mensagem}"`, (error, stdout, stderr) => {
		if (error) {
			console.error(`Erro ao abrir o CMD: ${error.message}`);
			return;
		}
		if (stderr) {
			console.error(`Erro: ${stderr}`);
			return;
		}
		console.log(stdout);
	});
};

export { alertarFimDoProcesso };