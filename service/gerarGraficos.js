import fs from "fs";
import fetch from "node-fetch";

let numGrafico = 1;
// Função para gerar gráfico de barras horizontal com QuickChart
async function gerarGrafico(dadosFator, setor = null) {
	// Agrupar dados por fator
	const fatoresAgrupados = {};
	dadosFator.forEach(({ fator, resposta, quantidade }) => {
		if (!fatoresAgrupados[fator]) fatoresAgrupados[fator] = [];
		fatoresAgrupados[fator].push({ resposta, quantidade });
	});

	const tempoRequisicao = 10000;
	const maximoTentativas = 5;

	let tentativa = 0;
	while (tentativa < maximoTentativas) {
		try {
			console.log(`\nTentativa ${tentativa + 1} de ${maximoTentativas}...`);
			const caminhosImagens = [];

			for (const [fator, respostas] of Object.entries(fatoresAgrupados)) {
				const totalRespostas = respostas.reduce((acumulador, valorAtual) => acumulador + valorAtual.quantidade, 0);

				const ordemRotulos = ["nunca", "raramente", "às vezes", "frequentemente", "sempre"];

				// Ordenar os dados de acordo com a ordem dos rótulos 
				const dadosOrdenados = respostas.map((respostaItem) => ({
					rotulo: respostaItem.resposta,
					porcentagem: Math.round((respostaItem.quantidade / totalRespostas) * 100)//.toFixed(0)
				})).sort((primeiro, segundo) => ordemRotulos.indexOf(primeiro.rotulo) - ordemRotulos.indexOf(segundo.rotulo)); // Ordenação

				// Ordenar os valores dos arrays rotulos e porcentagens
				const rotulosOrdenados = dadosOrdenados.map(dado => dado.rotulo);
				const porcentagensOrdenadas = dadosOrdenados.map(dado => dado.porcentagem);

				// Definir cores das barras com base na porcentagem
				const coresDasBarras = porcentagensOrdenadas.map(porcentagem => porcentagem <= 40 ? "#080" : porcentagem <= 80 ? "#cc0" : "#a00");

				// Define a altura dinâmica baseada no número de rótulos
				const alturaBase = 80; // Altura mínima por barra
				const alturaMinima = 200; // Altura mínima do gráfico
				const alturaMaxima = 700; // Altura máxima do gráfico

				const alturaDinamica = Math.min(
					Math.max(rotulosOrdenados.length * alturaBase, alturaMinima),
					alturaMaxima
				);

				// Gerar URL do gráfico com QuickChart
				const urlGrafico = `https://quickchart.io/chart?width=600&height=${alturaDinamica}&c=${encodeURIComponent(JSON.stringify({
					type: "horizontalBar",
					data: {
						labels: rotulosOrdenados,
						datasets: [{
							data: porcentagensOrdenadas, 
							backgroundColor: coresDasBarras,
							borderColor: "white",
							barThickness: "flex",
							maxBarThickness: 30,  // Define largura da barra
						}]
					},
					options: {
						indexAxis: "y", // Deixa as barras na horizontal
						title: {
							display: true,  // Exibe o título
							text: fator,
							fontSize: 16,  // Tamanho da fonte do título
							fontColor: "#000",  // Cor do título
							fontStyle: "Arial-Negrito",  // Estilo da fonte (negrito, itálico, etc.)
							padding: 10,  // Espaçamento ao redor do título
						},
						scales: {
							xAxes: [{
								scaleLabel: { 
									display: true,
									labelString: "Porcentagem (%)",
									fontSize: 16,
									fontColor: "#000",
									fontStyle: "bold",
								},
								ticks: {
									stacked: true, // Garante que as barras fiquem dentro de um espaço fixo
									beginAtZero: true,
									max: 100,
									padding: -20,
									stepSize: 20, // Marcações de 20 em 20%
									callback: function (value) {
										return `${value}%`;
									},
									font: {
										size: 20, // Tamanho da fonte das labels do eixo X
										weight: "bold",
									},
									color: "#000",
								},
								gridLines: { display: false }, // Exibe grade no eixo Y
							}],
							yAxes: [{
								scaleLabel: { 
									display: true,
									labelString: "Respostas", 
									fontSize: 16,
									fontColor: "#000",
									fontStyle: "bold",
								},
								gridLines: { display: false }, // Exibe grade no eixo Y
							}]
						},
						annotation: {
							clip: false, // Garante que as annotations fiquem visíveis mesmo fora do container
							annotations: [
								{
									type: 'line', mode: 'vertical', scaleID: 'x-axis-0', value: 40, borderColor: "#080", borderWidth: 1,
									label: {
										content: 'BAIXO', enabled: true, position: 'top', backgroundColor: "#0c0", yAdjust: 0,
										fontSize: 12,  // Ajusta o tamanho da fonte
									}
								},
								{
									type: 'line', mode: 'vertical', scaleID: 'x-axis-0', value: 60, borderColor: "#fff", borderWidth: 0.0005,
									label: {
										content: 'MODERADO', enabled: true, position: 'top', backgroundColor: "#aa0", yAdjust: 0,
										fontSize: 12,
									}
								},
								{
									type: 'line', mode: 'vertical', scaleID: 'x-axis-0', value: 80, borderColor: "#a00", borderWidth: 1,
									label: {
										content: 'ALTO', enabled: true, position: 'top', backgroundColor: "#c00", yAdjust: 0,
										fontSize: 12,
									}
								}
							]
						},
						legend: {
							display: false, // Remove a legenda e a caixinha de cor
						},
						plugins: {
							title: {
								display: false // Desativa qualquer título no gráfico
							},
							legend: {
								display: false // Remove a legenda
							},
							datalabels: {
								display: true,
								color: "#000",
								anchor: "center",
								align: "center",
								font: { weight: "bold", size: 14 },
							}
						},
						responsive: true,
						maintainAspectRatio: false,
						layout: {
							padding: {
								top: 10, // Aumenta o espaço no topo
								bottom: 10
							},
						}
					}
				}))}`;

				const controlaRequisicao = new AbortController();
				const abortaRequisicao = setTimeout(() => controlaRequisicao.abort(), tempoRequisicao);

				const respostaRequisicao = await fetch(urlGrafico, { signal: controlaRequisicao.signal });
				clearTimeout(abortaRequisicao);

				if (!respostaRequisicao.ok) {
					throw new Error(`\nErro na API: ${respostaRequisicao.statusText}`);
				}

				const bufferImagem = await respostaRequisicao.arrayBuffer();
				const buffer = Buffer.from(bufferImagem);
				
				const identificador = Date.now(); // Adiciona um identificador único baseado no timestamp
				const caminhoImagem = `assets/imagens/grafico_${identificador}_${fator.replace(/\s+/g, '_')}.png`;
				
				fs.writeFileSync(caminhoImagem, buffer);
				caminhosImagens.push(caminhoImagem);
			}	
			console.log(`✅ Gráfico ${numGrafico} gerado com sucesso!`);
			numGrafico++;
			return caminhosImagens;
		} catch (error) {

			tentativa++;
			if (tentativa >= maximoTentativas) {
				console.error("🚨 Todas as tentativas falharam. Abortando operação.");
				throw new Error(`Falha ao gerar gráficos após ${maximoTentativas} tentativas.`);
			}
			console.log("\n🔄 Reiniciando processo...");
		}
	}	
}
export { gerarGrafico };
