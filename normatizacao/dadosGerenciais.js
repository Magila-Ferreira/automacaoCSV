function normalizarDadosParaOBanco(dadosGerenciais) {
	const dadosNormalizados = {};

	for (const [fator, conteudo] of Object.entries(dadosGerenciais)) {
		const { respostas, risco } = conteudo;

		if (respostas && respostas.length > 0) {
			const primeiraResposta = respostas[0];

			dadosNormalizados[fator] = {
				risco: risco.toFixed(1),
			};
		}
	}
	return dadosNormalizados;	
}

function normalizarDadosSetorParaOBanco(dadosGerenciaisSetor) {
	//console.log('ENTRADA DA FUNÇÃO ===>');
	//console.log(JSON.stringify(dadosGerenciaisSetor, null, 2));

	const dadosNormalizados = [];

	if (!dadosGerenciaisSetor || typeof dadosGerenciaisSetor !== 'object') {
		console.warn('Dados inválidos recebidos na função.');
		return dadosNormalizados;
	}

	for (const [setor, conteudo] of Object.entries(dadosGerenciaisSetor)) {
		if (!conteudo || !Array.isArray(conteudo.respostas)) {
			console.warn(`Sem respostas válidas para o setor: ${setor}`); // Dados de resposta não é um array --------------> ERRO!!!
			continue;
		}

		for (const resposta of conteudo.respostas) {
			if (!resposta?.setor) {
				console.warn(`Resposta sem setor: ${JSON.stringify(resposta)}`);
				continue;
			}
			
			dadosNormalizados.push({
				setor,
				risco: Number(conteudo.risco).toFixed(1),
				fator: resposta.fator,
				id_fator: resposta.id_fator
			});
		}
	}

	//console.log('Resultado final:', dadosNormalizados);
	return dadosNormalizados;
}


export { normalizarDadosParaOBanco, normalizarDadosSetorParaOBanco };
