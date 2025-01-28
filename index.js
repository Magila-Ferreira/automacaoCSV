/* 1. Configuração do ambinete */

//const { resolve } = require('chart.js/helpers');

// Início do programa
const { inicializarPrograma } = require('./monitoramento/monitorarPasta');

(async () => {
    try {
        inicializarPrograma();
    }
    catch (error) {
        console.error("Erro ao iniciar o programa: ", error);
    }
})();

/* O programa precisa verificar se os dados do banco possui consistência em relação ao dados do arquivo, toda vez que um novo arquivo for encontrado na pasta */

/* 3. Sistematização dos Dados */