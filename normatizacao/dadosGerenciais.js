function normalizarDadosEmpresa(dadosGerenciais) {
	const dadosNormalizados = [];

	for (const [fator, conteudo] of Object.entries(dadosGerenciais)) {
		const { respostas, risco } = conteudo;

		if (respostas && respostas.length > 0) {
			dadosNormalizados[fator] = {
				risco: risco.toFixed(2),
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
				setor: normalizarTexto(setor),
				fator: parseInt(idFator, 10),
				risco: parseFloat(conteudo.risco).toFixed(2)
			});
		}
	}
	return dadosNormalizados;
}
async function agruparDadosPorSetor(dadosGerenciaisSetor) {
	const agrupadoPorSetor = {}; // Objeto final a ser retornado

	for (const questaoId in dadosGerenciaisSetor) { // Percorre as questões do objeto dadosGerenciaisSetor
		const { fator, respostas } = dadosGerenciaisSetor[questaoId]; // Desestruturação do objeto
		// A desistruturação serve para acessar o fator e as respostas diretamente, 
		// sem precisar dos passsos intermediários, Exemplo: 
		// fator = dadosGerenciaisSetor[questaoId].fator ou 
		// respostas = dadosGerenciaisSetor[questaoId].respostas

		// Percorre todas as respostas da questão atual
		respostas.forEach(resposta => {
			const setor = normalizarTexto(resposta.setor); // Obtém o nome do setor associado à resposta

			// Cria o objeto do agrupamento por setor, se ainda não existir
			if (!agrupadoPorSetor[setor]) {
				agrupadoPorSetor[setor] = {};
			}

			// Cria a questão dentro do setor se ainda não existir
			if (!agrupadoPorSetor[setor][questaoId]) {
				agrupadoPorSetor[setor][questaoId] = {
					fator, // Mantém o fator associado à questão
					respostas: [], // Inicia um array para armazenar as respostas
				};
			}
			agrupadoPorSetor[setor][questaoId].respostas.push(resposta); // Adiciona a resposta atual ao array de
			// 																respostas do setor e questão correspondente
		});
	}
	return agrupadoPorSetor;
}
async function estruturaDadosPorSetor(dadosPorFator) {
	const estrutura = {};

	const dados = Object.values(dadosPorFator).flat();

	for (const { setor, escala, fator, porcentagem_risco, id_fator } of dados) {
		if (!estrutura[setor]) {
			estrutura[setor] = {};
		}

		if (!estrutura[setor][escala]) {
			estrutura[setor][escala] = []; // Deve ser um array!
		}
		
		estrutura[setor][escala].push({
			setor,
			escala,
			fator,
			id_fator,
			porcentagem_risco
		});
	}
	return estrutura;
};
function normalizarTexto(texto) {
	return typeof texto === 'string' ? texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase() : texto;
};
export { normalizarDadosEmpresa, normalizarDadosSetor, agruparDadosPorSetor, estruturaDadosPorSetor, normalizarTexto };
