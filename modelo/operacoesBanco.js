/* 5. Operações com o banco de dados */

const { gerenciadorDeConexoesBD } = require('../configuracoes/configBanco');
const usuario = 'root'; // Usuário com permissões para criar banco e tabelas

const criarBancoEDefinirTabelas = async (database, identificacaoCols, respostasCols) => {
    const conexoes = gerenciadorDeConexoesBD(null, usuario);

    try {
        // SQL
        const create_database = `CREATE DATABASE IF NOT EXISTS \`${database}\`
            CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`;        

        // Criar banco de dados
        await conexoes.query(create_database);
        
        // Reutilizar a conexão para o banco criado
        const db = gerenciadorDeConexoesBD(database);

        // SQL
        const create_table_identificacao = `CREATE TABLE IF NOT EXISTS identificacao (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ${identificacaoCols.map((col) => {
                // Define o tipo de dados e atributos para cada coluna
                switch (col) {
                    case 'setor':
                    case 'cargo':
                    case 'escolaridade':
                    case 'estadoCivil':
                    case 'genero':
                        return `\`${col}\` VARCHAR(100) NOT NULL`;
                    case 'idade':
                        return `\`${col}\` INT NOT NULL`;
                    
                    default:
                        return `\`${col}\` TEXT NOT NULL`; // Define o tipo de dados padrão    
                }
            }).join(', ')},
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`;

        const create_table_respostas = `CREATE TABLE IF NOT EXISTS respostas (
            id INT AUTO_INCREMENT PRIMARY KEY, id_identificacao INT NOT NULL, 
            ${respostasCols.map((col) => `\`${col}\` VARCHAR(20) NOT NULL`).join(', ')}, 
            FOREIGN KEY (id_identificacao) REFERENCES identificacao(id));`;

        // Criar tabelas `identificacao` e `respostas`
        await db.query(create_table_identificacao);
        await db.query(create_table_respostas); 
        db.end();

        console.log(`\n Banco "${database}" e Tabelas criadas.`);
    } catch (error) {
        console.error("\n Erro ao criar banco ou tabelas: ", error.message);
    } finally {
        conexoes.end();
    }
}
const salvarDados = async (dados, database) => {
    const db = gerenciadorDeConexoesBD(database, usuario);
    
    try {
        // SQL --> IDENTIFICACAO e RESPOSTAS
        const insert_identificacao = `
        INSERT IGNORE INTO identificacao 
        (setor, cargo, idade, escolaridade, estadoCivil, genero) 
        VALUES (?, ?, ?, ?, ?, ?)`;

        const insert_respostas = (colunas) => `INSERT IGNORE INTO respostas 
        (id_identificacao, ${colunas.join(', ')}) VALUES (?, ${colunas.map(() => '?').join(', ')})`;

        for (const item of dados) {                     
            const valores_identificacao = [
                item.setor,
                item.cargo, 
                parseInt(item.idade, 10), 
                item.escolaridade, 
                item.estadoCivil, 
                item.genero];
                
                // Insere na tabela 'identificação' caso não exista
                const [result] = await db.query(insert_identificacao, valores_identificacao);
                const id_identificacao = result.insertId;

            // VERIFICAÇÃO ADICIONAL:
            if (id_identificacao) {
                const colunasRespostas = Object.keys(item).slice(6); // Obter o nome das colunas do arquivo para a tabela respostas
                const valores_respostas = Object.values(item).slice(6); // Obter os valores do arquivo para a tabela respostas
                await db.query(insert_respostas(colunasRespostas), [id_identificacao, ...valores_respostas]); 
            } 
        }
    } catch (error) {
        console.error(`\n Erro ao salvar dados. Banco: ${database}, Erro: ${error.message}`);
    } finally {
        db.end();
    }
};

// Recupera os registros do banco
const recuperarDadosDoBanco = async (database) => {
    const db = gerenciadorDeConexoesBD(database);

    try {
        const select_dados_identificacao = `
            SELECT setor, cargo, idade, escolaridade, estadoCivil, genero 
            FROM identificacao`;

        const [rows] = await db.query(select_dados_identificacao);       

        if (!rows || rows.length === 0) {
            console.warn("\n Banco de dados VAZIO!");
            return [];
        }
        
        return rows.map(row => ({
            setor: row.setor?.trim(),
            cargo: row.cargo?.trim(),
            idade: parseInt(row.idade, 10),
            escolaridade: row.escolaridade?.trim(),
            estadoCivil: row.estadoCivil?.trim(),
            genero: row.genero?.trim(),           
        }));
    } catch (error) {
        console.error(`\n Erro ao recuperar dados: ${error.message}`);
        return [];
    } finally {
        db.end();
    }
}

// Seleciona os dados do banco para salvar no PDF
const selecionarDadosPDF = async (database, nomeDasColunasNaTabelaRespostas) => {
    const db = gerenciadorDeConexoesBD(database);

    try {
        if (nomeDasColunasNaTabelaRespostas.length === 0) {
            console.warn("\n Colunas não encontradas na tabela 'respostas'!");
            return [];
        }

        // SQL com colunas dinâmicas para a tabela respostas  
        const select_dados_pdf = `
            SELECT i.setor, i.cargo, i.idade, i.escolaridade, i.estadoCivil, i.genero, r.id 
                AS id_resposta, ${nomeDasColunasNaTabelaRespostas.map((coluna) => `r.${coluna}`).join(', ')} 
            FROM identificacao i
            LEFT JOIN respostas r ON i.id = r.id_identificacao`;

        const [rows] = await db.query(select_dados_pdf);       

        if (!rows || rows.length === 0) {
            console.warn("\n Não há dados para gerar o PDF!");
            return [];
        }

        // Inclusão dinâmica dos resultados
        return rows.map(row => ({
            setor: row.setor,
            cargo: row.cargo,
            idade: parseInt(row.idade, 10),
            escolaridade: row.escolaridade,
            estadoCivil: row.estadoCivil,
            genero: row.genero,
            respostas: nomeDasColunasNaTabelaRespostas.reduce((colDinamicas, coluna) => {
                colDinamicas[coluna] = row[coluna];
                return colDinamicas;
            }, {})
    }));

    } catch (error) {
        console.error(`\n Erro no SELECT dos dados para gerar o PDF: ${error.message}`);
        return [];
    } finally {
        db.end();
    }
}
module.exports = { criarBancoEDefinirTabelas, salvarDados, recuperarDadosDoBanco, selecionarDadosPDF };