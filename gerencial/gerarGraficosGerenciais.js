import fs from 'fs';
import fetch from 'node-fetch';

let numGrafico = 1;

async function gerarGraficosGerenciais(dadosEscala, setor = null) {
	const tempoRequisicao = 10000;
	const maximoTentativas = 5;
	const largura = 750;
	const altura = 450;
	let tentativa = 0;
	const caminhosImagens = [];

	// Garante que estamos lidando com um array plano, mesmo que venha agrupado por escala
	const dadosConvertidos = Array.isArray(dadosEscala)
		? dadosEscala
		: Object.values(dadosEscala).flat();

	// Agrupar dados por escala
	const escalasAgrupadas = {};

	dadosConvertidos.forEach(({ escala, fator, porcentagem_risco }) => { 
		if (!escalasAgrupadas[escala]) escalasAgrupadas[escala] = [];

		escalasAgrupadas[escala].push({ escala, fator, porcentagem_risco });
	});

	while (tentativa < maximoTentativas) {
		try {
			for (const [escala, listaDeFatores] of Object.entries(escalasAgrupadas)) {
				const fatores = listaDeFatores.map(f => f.fator);
				const riscos = listaDeFatores.map(f => f.porcentagem_risco);

				const corBarra = riscos.map(valor =>
					valor <= 40 ? "#080" : valor <= 80 ? "#cc0" : "#c00"
				);

				const urlGrafico = `https://quickchart.io/chart?width=${largura}&height=${altura}&c=${encodeURIComponent(JSON.stringify({
					type: "horizontalBar",
					data: {
						labels: fatores,
						datasets: [{
							data: riscos,
							backgroundColor: corBarra,
							barThickness: "flex",
							maxBarThickness: 50
						}]
					},
					options: {
						indexAxis: "y",
						title: {
							display: true,
							text: escala,
							fontSize: 20,
							fontColor: "#a00",
							fontStyle: "bold",  // Estilo da fonte (negrito, itálico, etc.)
							padding: 20,
						},
						scales: {
							xAxes: [{
								scaleLabel: {
									display: true,
									labelString: "Valores em Porcentagem (%)",
									fontSize: 16,
									fontColor: "#005",
									fontStyle: "bold",
								},
								ticks: {
									beginAtZero: true,
									max: 100,
									padding: -20,
									stepSize: value => `${value}%`,
									fontSize: 16,
									fontColor: "#555"
								},
								gridLines: { display: false }
							}],
							yAxes: [{
								scaleLabel: {
									display: true,
									labelString: "FATORES",
									fontSize: 16,
									fontColor: "#a00",
									fontStyle: "bold",
								},
								ticks: {
									fontSize: 16,
									fontColor: "#000"
								},
								gridLines: { display: false }
							}]
						},
						annotation: {
							clip: false, // Garante que as annotations fiquem visíveis mesmo fora do container
							annotations: [
								{
									type: 'line', mode: 'vertical', scaleID: 'x-axis-0', value: 0, borderColor: "#aaa", borderWidth: 0.5,
								},
								{
									type: 'line', mode: 'vertical', scaleID: 'x-axis-0', value: 40, borderColor: "#080", borderWidth: 1.5,
									label: {
										content: 'BAIXO', enabled: true, position: 'top', backgroundColor: "#0c0", yAdjust: 0,
										fontSize: 14, // Ajusta o tamanho da fonte
									}
								},
								{
									type: 'line', mode: 'vertical', scaleID: 'x-axis-0', value: 60, borderColor: "#cc0", borderWidth: 1.5,
									label: {
										content: 'MODERADO', enabled: true, position: 'top', backgroundColor: "#aa0", yAdjust: 0,
										fontSize: 14,
									}
								},
								{
									type: 'line', mode: 'vertical', scaleID: 'x-axis-0', value: 80, borderColor: "#c00", borderWidth: 1.5,
									label: {
										content: 'ALTO', enabled: true, position: 'top', backgroundColor: "#a00", yAdjust: 0,
										fontSize: 14,
									}
								}
							]
						},
						legend: { display: false },
						plugins: {
							datalabels: {
								display: true,
								color: "#000",
								anchor: "center",
								align: "center",
								font: { weight: "bold", size: 18 }
							}
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
					throw new Error(`Erro na API: ${respostaRequisicao.statusText}`);
				}

				const bufferImagem = await respostaRequisicao.arrayBuffer();
				const buffer = Buffer.from(bufferImagem);

				const identificador = Date.now();
				const caminhoImagem = `assets/imagens/grafico_gerencial_${identificador}.png`;

				fs.writeFileSync(caminhoImagem, buffer);
				caminhosImagens.push(caminhoImagem);

				console.log(`✅ Gráfico ${ numGrafico } gerado com sucesso!`);
			};
			numGrafico++;
			return caminhosImagens;
		} catch (error) {
			tentativa++;
			if (tentativa >= maximoTentativas) {
				console.error("🚨 Todas as tentativas falharam. Abortando operação.");
				throw new Error(`Falha ao gerar gráficos após ${maximoTentativas} tentativas.`);
			}
			console.log("🔄 Tentando novamente...");
		}
	}
}
export { gerarGraficosGerenciais };
