function normalizarDadosEmpresa(dadosGerenciais) {
	const dadosNormalizados = [];

	for (const [fator, conteudo] of Object.entries(dadosGerenciais)) {
		const { respostas, risco } = conteudo;

		if (respostas && respostas.length > 0) {
			dadosNormalizados[fator] = {
				risco: risco.toFixed(1),
			};
		}
	}
	return dadosNormalizados;	
}
function normalizarDadosSetor(dadosGerenciaisSetor) {
	const dadosNormalizados = [];

	// Verifica se dadosGerenciaisSetor não está vazio ou se não é um objeto 
	if (!dadosGerenciaisSetor || typeof dadosGerenciaisSetor !== 'object') {
		console.warn('Dados inválidos recebidos na função.');
		return dadosNormalizados;
	}

	// Desestrutura o objeto e percorre os setores
	for (const [setor, fatores] of Object.entries(dadosGerenciaisSetor)) {

		// Verifica se os fatores não estão vazios ou se não é um objeto
		if (!fatores || typeof fatores !== 'object') {
			console.warn(`Sem fatores válidos para o setor: ${setor}`);
			continue;
		}

		// Desestrutura o objeto e percorre os fatores
		for (const [idFator, conteudo] of Object.entries(fatores)) {

			// Verifica se o conteúdo não está vazio ou se as respostas não são um array 
			if (!conteudo || typeof conteudo.risco !== 'number') {
				console.warn(`Sem risco válido para o setor: ${setor}, fator: ${idFator}`);
				continue;
			}
			dadosNormalizados.push({
				setor: setor,
				fator: parseInt(idFator, 10),
				risco: parseFloat(conteudo.risco).toFixed(1)
			});
		}
	}
	return dadosNormalizados;
}
export { normalizarDadosEmpresa, normalizarDadosSetor };
