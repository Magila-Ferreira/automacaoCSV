export const ordemRotulos = ["Nunca", "Raramente", "Às vezes", "Frequentemente", "Sempre"];

export function normalizarRespostas(dados) {
	const mapa = new Map(dados.map(({ resposta, quantidade }) => [
		resposta,
		quantidade
	]));

	return ordemRotulos.map(resposta => ({
		resposta,
		quantidade: mapa.get(resposta) || 0
	}));
}

export function calcularTotalRespostas(dados) {
	const mapa = new Map(dados.map(({ resposta, quantidade }) => [
		resposta,
		quantidade
	]));

	return ordemRotulos.reduce((total, rotulo) => {
		return total + (mapa.get(rotulo) || 0);
	}, 0);
}