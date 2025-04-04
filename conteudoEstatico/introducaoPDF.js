/* CONTEÚDO DO PDF */
const texto = `Este relatório foi gerado a partir de arquivos excel, com dados coletados na Análise Preliminar de Riscos Psicossociais. Possui como objetivo sistematizar os dados coletados, com a seguinte estrutura:

- Os riscos foram analisados em quatro escalas:
    1. Organização do trabalho
    2. Estilo de gestão
    3. Indicadores de sofrimento no trabalho
    4. Danos relacionados ao trabalho

- Cada escala se subdivide em fatores específicos, totalizando dez fatores:
    1.  Divisão de tarefas
    2.  Divisão social do trabalho
    3.  Estilo individualista
    4.  Estilo coletivista
    5.  Falta de sentido no trabalho
    6.  Esgotamento mental
    7.  Falta de reconhecimento
    8.  Danos psicológicos
    9.  Danos sociais
    10. Danos físicos
    
    Os gráficos correspondem a sistematização da quantidade de respostas por fator. Cada gráfico apresenta a porcentagem do respectivo fator com base em cinco variáveis de respostas: nunca, raramente, às vezes, frequentemente e sempre. As variáveis de respostas encontram-se dispostas de forma proporcional, de 0 a 100%, onde o conjunto de todas as respostas para determinado fator corresponde a 100%. Havendo mais de uma variável de resposta, a porcentagem é distribuída entre elas.
    
    OBSERVAÇÃO: devido ao cálculo com arredondamento das porcentagens, a soma das porcentagens (das variáveis de resposta) pode não corresponder exatamente a 100%, variando entre 99% e 101% (1% a mais ou a menos).

    - Entende-se que:

        Uma variável de resposta que comporta mais de 80% das respostas do fator, corresponde a um ALTO indicador de unanimidade em relação ao fator.

        Uma variável de resposta que comporta entre 40% e 80% das respostas do fator, corresponde a um MODERADO indicador de unanimidade em relação ao fator.

        Uma variável de resposta que comporta menos de 40% das respostas do fator, corresponde a um BAIXO indicador de unanimidade em relação ao fator.
`;

function limparTexto(texto) {
	return texto
		// Remove caracteres de controle invisíveis exceto tab, newline e carriage return
		.replace(/[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD]/g, '')
		// Remove substituições Unicode e área privada (inclui U+F000 e semelhantes)
		.replace(/[\uF000-\uF8FF\uFFF0-\uFFFF]/g, '')
		// Remove espaços/tabs no final de linhas
		.replace(/[ \t]+$/gm, '');
}

const introducao = limparTexto(texto);

export { introducao };