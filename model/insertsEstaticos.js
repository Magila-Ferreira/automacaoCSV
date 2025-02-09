const escalas = {
    escala1: {nome: "ESCALA 1 - ORGANIZAÇAO DO TRABALHO"},
    escala2: {nome: "ESCALA 2 - ESTILOS DE GESTÃO"},
    escala3: {nome: "ESCALA 3 - INDICADORES DE SOFRIMENTO NO TRABALHO"},
    escala4: {nome: "ESCALA 4 - DANOS RELACIONADOS AO TRABALHO"},
};

const fatores = {
    /* ESCALA 1 */
    fator1: {nome: "FATOR 1 - divisão das tarefas", id_escala: 1},
    fator2: {nome: "FATOR 2 - divisão social do trabalho", id_escala: 1},
    /* ESCALA 2 */
    fator3: {nome: "FATOR 1 - estilo individualista", id_escala: 2},
    fator4: {nome: "FATOR 2 - estilo coletivista", id_escala: 2},
    /* ESCALA 3 */
    fator5: {nome: "FATOR 1 - falta de sentido no trabalho", id_escala: 3},
    fator6: {nome: "FATOR 2 - esgotamento mental", id_escala: 3},
    fator7: {nome: "FATOR 3 - falta de reconhecimento", id_escala: 3},
    /* ESCALA 4 */
    fator8: {nome: "FATOR 1 - danos psicologicos", id_escala: 4},
    fator9: {nome: "FATOR 2 - danos sociais", id_escala: 4},
    fator10:{nome: "FATOR 3 - danos fisicos", id_escala: 4},
};

const questoes = {
    /* ESCALA 1 */
    questao1: { afirmacao: "Os recursos de trabalho são em número suficiente para a realização das tarefas.", id_fator: 1},
    questao2: { afirmacao: "Há clareza na definição das tarefas.", id_fator: 2},
    questao3: { afirmacao: "A comunicação entre chefe e subordinado é adequada.", id_fator: 2},
    questao4: { afirmacao: "Tenho autonomia para realizar as tarefas como julgo melhor.", id_fator: 2},
    questao5: { afirmacao: "Há qualidade na comunicação entre os funcionários.", id_fator: 2},
    questao6: {afirmacao: "As informações que preciso para executar minhas tarefas são claras.", id_fator: 2},
    questao7: {afirmacao: "O ritmo de trabalho é adequado.", id_fator: 1},
    questao8: {afirmacao: "Os prazos para a realização das tarefas são flexíveis.", id_fator: 1},
    questao9: {afirmacao: "As orientações que me são passadas para realizar as tarefas são coerentes entre si.", id_fator: 2},
    /* ESCALA 2 */
    questao10: {afirmacao: "A hierarquia é valorizada nesta organização.", id_fator: 3},
    questao11: {afirmacao: "Há forte controle do trabalho.", id_fator: 3},
    questao12: {afirmacao: "Quando há mudanças na organização, reflete no ambiente de trabalho.", id_fator: 3},
    questao13: {afirmacao: "O mérito das conquistas na empresa é de todos.", id_fator: 4},
    questao14: {afirmacao: "O trabalho coletivo é valorizado pelos gestores.", id_fator: 4},
    questao15: {afirmacao: "Somos incentivados pelos gestores a buscar novos desafios.", id_fator: 4},
    questao16: {afirmacao: "A competência dos trabalhadores é valorizada pela gestão.", id_fator: 4},
    questao17: {afirmacao: "Os gestores se preocupam com o bem estar dos trabalhadores.", id_fator: 4},
    questao18: {afirmacao: "A inovação é valorizada nesta organização.", id_fator: 4},
    /* ESCALA 3 */
    questao19: {afirmacao: "Meu trabalho é valorizado", id_fator: 5},
    questao20: {afirmacao: "Considero minhas tarefas importantes", id_fator: 5},
    questao21: {afirmacao: "Sinto-me produtivo no meu trabalho", id_fator: 5},
    questao22: {afirmacao: "Sinto-me motivado para realizar minhas tarefas", id_fator: 5},
    questao23: {afirmacao: "Meu trabalho é cansativo", id_fator: 6},
    questao24: {afirmacao: "Meu trabalho me safisfaz", id_fator: 6},
    questao25: {afirmacao: "Meu trabalho me sobrecarrega", id_fator: 6},
    questao26: {afirmacao: "Mantenho boa convivência com meus colegas", id_fator: 7},
    questao27: {afirmacao: "O trabalho que realizo é qualificado pela chefia", id_fator: 7},
    questao28: {afirmacao: "Me sinto livre para dialogar com minha chefia", id_fator: 7},
    questao29: {afirmacao: "Sou sujeito a assédio pessoal sob a forma de palavras ou comportamentos incorretos", id_fator: 7},
    /* ESCALA 4 */
    questao30: {afirmacao: "Amargura", id_fator: 8},
    questao31: {afirmacao: "Sensação de vazio", id_fator: 8},
    questao32: {afirmacao: "Mau-Humor", id_fator: 8},
    questao33: {afirmacao: "Vontade de Desistir de Tudo", id_fator: 8},
    questao34: {afirmacao: "Tristeza", id_fator: 8},
    questao35: {afirmacao: "Perda da auto-confiança", id_fator: 8},
    questao36: {afirmacao: "Solidão", id_fator: 8},
    questao37: {afirmacao: "Dificuldades nas relações fora do trabalho", id_fator: 9},
    questao38: {afirmacao: "Vontade de ficar sozinho", id_fator: 9},
    questao39: {afirmacao: "Conflitos nas relações familiares", id_fator: 9},
    questao40: {afirmacao: "Agressividade com os outros", id_fator: 9},
    questao41: {afirmacao: "Dificuldade com os amigos", id_fator: 9},
    questao42: {afirmacao: "Impaciência com as pessoas em geral", id_fator: 9},
    questao43: {afirmacao: "Dores no corpo", id_fator: 10},
    questao44: {afirmacao: "Distúrbios digestivos", id_fator: 10},
    questao45: {afirmacao: "Alterações no sono", id_fator: 10},
    questao46: {afirmacao: "Alterações no apetite", id_fator: 10},  
};
export { escalas, fatores, questoes };