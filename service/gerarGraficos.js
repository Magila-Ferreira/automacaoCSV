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
			const caminhosImagens = [];

			const ordemRotulos = ["nunca", "raramente", "às vezes", "frequentemente", "sempre"];
			
			for (const [fator, respostas] of Object.entries(fatoresAgrupados)) {
				
				// Mapeia as respostas existentes no fator
				const mapaDeRespostas = new Map(respostas.map(respostaItem => [
					respostaItem.resposta,
					respostaItem.quantidade
				]));

				// Adicionar respostas com quantidade 0
				const respostasCompletas = ordemRotulos.map(rotulo => ({
					resposta: rotulo,
					quantidade: mapaDeRespostas.get(rotulo) || 0 // Retorna 0 se não houver valor
				}));

				const totalRespostas = respostasCompletas.reduce((acumulador, valorAtual) => acumulador + valorAtual.quantidade, 0);

				// Ordena os dados de acordo com os rotulosOrdenados e calcula sua porcentagem
				const dadosOrdenados = respostasCompletas.map((respostaItem) => ({
					rotulo: respostaItem.resposta,
					porcentagem: totalRespostas > 0 ? Math.round((respostaItem.quantidade / totalRespostas) * 100) : 0
				}));

				// Ordenar os valores dos arrays rotulos e porcentagens
				const rotulosOrdenados = dadosOrdenados.map(dado => dado.rotulo);
				const porcentagensOrdenadas = dadosOrdenados.map(dado => dado.porcentagem);

				// Definir cores das barras com base na porcentagem
				const coresDasBarras = porcentagensOrdenadas.map(porcentagem => porcentagem <= 40 ? "#080" : porcentagem <= 80 ? "#cc0" : "#c00");

				// Define a altura dinâmica baseada no número de rótulos
				const largura = 600; // Largura do gráfico
				const altura= 400; // Altura máxima do gráfico

				// Gerar URL do gráfico com QuickChart
				const urlGrafico = `https://quickchart.io/chart?width=${largura}&height=${altura}&c=${encodeURIComponent(JSON.stringify({
					type: "horizontalBar",
					data: {
						labels: rotulosOrdenados,
						datasets: [{
							data: porcentagensOrdenadas,
							backgroundColor: coresDasBarras,
							barThickness: "flex",
							maxBarThickness: 30,  // Define largura máxima da barra
						}]
					},
					options: {
						indexAxis: "y", // Deixa as barras na horizontal
						title: {
							display: true,  // Exibe o título
							text: fator,
							fontSize: 20,  // Tamanho da fonte do título
							fontColor: "#000",  // Cor do título
							fontStyle: "Arial-Negrito",  // Estilo da fonte (negrito, itálico, etc.)
							padding: 10,  // Espaçamento ao redor do título
						},
						scales: {
							xAxes: [{
								scaleLabel: {
									display: true,
									labelString: "Porcentagens (%)",
									fontSize: 16,
									fontColor: "#000",
									fontStyle: "bold",
								},
								ticks: {
									beginAtZero: true,
									max: 100,
									padding: -20,
									stepSize: 20, // Marcações de 20 em 20%
									callback: value => `${value}%`,
									fontSize: 16,
									fontColor: "#555",
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
								ticks: {
									fontSize: 16,
									fontColor: "#555",
								},
								gridLines: { display: false }, // Exibe grade no eixo Y
							}]
						},
						annotation: {
							clip: false, // Garante que as annotations fiquem visíveis mesmo fora do container
							annotations: [
								{
									type: 'line', mode: 'vertical', scaleID: 'x-axis-0', value: 0, borderColor: "#555", borderWidth: 1,
								},
								{
									type: 'line', mode: 'vertical', scaleID: 'x-axis-0', value: 40, borderColor: "#080", borderWidth: 1.5,
									label: {
										content: 'BAIXO', enabled: true, position: 'top', backgroundColor: "#0c0", yAdjust:0,
										fontSize: 12, // Ajusta o tamanho da fonte
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
									type: 'line', mode: 'vertical', scaleID: 'x-axis-0', value: 80, borderColor: "#a00", borderWidth: 1.5,
									label: {
										content: 'ALTO', enabled: true, position: 'top', backgroundColor: "#a00", yAdjust: 0,
										fontSize: 12,
									}
								}
							]
						},
						legend: {
							display: false, // Remove a legenda e a caixinha de cor
						},
						plugins: {
							datalabels: {
								display: true,
								color: "#000",
								anchor: "center",
								align: "center",
								font: { weight: "bold", size: 14 },
							},
						},
						responsive: true,
						maintainAspectRatio: false,
						layout: {
							padding: {
								top: 0, // Aumenta o espaço no topo
								bottom: 0
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
