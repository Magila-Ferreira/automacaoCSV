function normalizarDadosParaOBanco(dadosGerenciais) {
	const dadosNormalizados = {};

	for (const [fator, conteudo] of Object.entries(dadosGerenciais)) {
		const { respostas, risco } = conteudo;

		if (respostas && respostas.length > 0) {
			const primeiraResposta = respostas[0];

			dadosNormalizados[fator] = {
				escala: primeiraResposta.escala,
				risco: risco
			};
		}
	}
	return dadosNormalizados;	
}

export { normalizarDadosParaOBanco };
