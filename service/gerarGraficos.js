import fs from "fs";
import fetch from "node-fetch";

// Função para gerar gráfico de barras horizontal com QuickChart
async function gerarGrafico(dadosFator) {
	// Agrupar dados por fator
	const fatoresAgrupados = {};
	dadosFator.forEach(({ fator, resposta, quantidade }) => {
		if (!fatoresAgrupados[fator]) fatoresAgrupados[fator] = [];
		fatoresAgrupados[fator].push({ resposta, quantidade });
	});

	const caminhosImagens = [];

	for (const [fator, respostas] of Object.entries(fatoresAgrupados)) {
		const totalRespostas = respostas.reduce((acumulador, valorAtual) => acumulador + valorAtual.quantidade, 0);

		const ordemRotulos = ["nunca", "raramente", "às vezes", "frequentemente", "sempre"];
		
		// Ordenar os dados de acordo com a ordem dos rótulos 
		const dadosOrdenados = respostas.map((respostaItem) => ({
			rotulo: respostaItem.resposta,
			porcentagem: (respostaItem.quantidade / totalRespostas) * 100
		})).sort((primeiro, segundo) => ordemRotulos.indexOf(primeiro.rotulo) - ordemRotulos.indexOf(segundo.rotulo)); // Ordenação
		
		// Ordenar os valores dos arrays rotulos e porcentagens
		const rotulosOrdenados = dadosOrdenados.map(dado => dado.rotulo);
		const porcentagensOrdenadas = dadosOrdenados.map(dado => dado.porcentagem);
		
		// Definir cores das barras com base na porcentagem
		const coresDasBarras = porcentagensOrdenadas.map(porcentagem => porcentagem <= 40 ? "#00B050" : porcentagem <= 80 ? "#dd0" : "#FF0000");

		// Gerar URL do gráfico com QuickChart
		const urlGrafico = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify({
			type: "horizontalBar",
			data: {
				labels: rotulosOrdenados,
				datasets: [{
					data: porcentagensOrdenadas,
					backgroundColor: coresDasBarras,
					borderColor: "white",
					barThickness: "flex",
					maxBarThickness: 20  // Define largura da barra
				}]
			},
			options: {
				scales: {
					xAxes: [{
						ticks: {
							beginAtZero: true,
							max: 100,
							stepSize: 20, // Marcações de 20 em 20%
							callback: value => `${value}%` // Adiciona "%" aos valores
						},
						gridLines: { display: false } // Exibe grade no eixo X
					}],
					yAxes: [{
						ticks: {
							beginAtZero: false,
							min: -40,
						},
						gridLines: { display: false } // Remover a linha de grade do eixo Y
					}] 
				},
				annotation: {
					annotations: [
						{
							type: 'line', mode: 'vertical', scaleID: 'x-axis-0', value: 20, borderColor: "#aaa", borderWidth: 0.5,
							label: { content: 'BAIXO', enabled: true, position: 'top', backgroundColor: "#00B050", hoverBackgroundColor: "#009030", color: "#fff" }
						},
						{
							type: 'line', mode: 'vertical', scaleID: 'x-axis-0', value: 50, borderColor: "#aaa", borderWidth: 0.5,
							label: { content: 'MODERADO', enabled: true, position: 'top', backgroundColor: "#cc0", hoverBackgroundColor: "#aa0", color: "#fff" }
						},
						{
							type: 'line', mode: 'vertical', scaleID: 'x-axis-0', value: 80, borderColor: "#aaa", borderWidth: 0.5,
							label: { content: 'ALTO', enabled: true, position: 'top', backgroundColor: "#FF0000", hoverBackgroundColor: "#dd0000", color: "#fff" }
						}
					]
				},
				legend: {
					display: false // Remove a legenda e a caixinha de cor
				},
				plugins: {
					title: {
						display: false // Desativa qualquer título no gráfico
					},
					legend: {
						display: false // Remove a legenda
					}
				},
			}
		}))}`;

		// Baixar a imagem do gráfico
		const respostaRequisicao = await fetch(urlGrafico);
		const bufferImagem = await respostaRequisicao.arrayBuffer();
		const buffer = Buffer.from(bufferImagem);
		const caminhoImagem = `assets/imagens/grafico_${fator.replace(/\s+/g, '_')}.png`;
		fs.writeFileSync(caminhoImagem, buffer);
		caminhosImagens.push(caminhoImagem);
	}
	return caminhosImagens;
}
export { gerarGrafico };
