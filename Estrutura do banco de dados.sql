/* Estrutura do banco de dados */

-- Comandos executados no terminal MySQL 
create DATABASE automacao_csv CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
use automacao_csv;
CREATE TABLE identificacao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setor VARCHAR(100) NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    idade INT NOT NULL,
    escolaridade VARCHAR(100) NOT NULL,
    estadoCivil VARCHAR(50) NOT NULL,
    genero VARCHAR(50) NOT NULL
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE respostas (
    id_resposta INT AUTO_INCREMENT PRIMARY KEY,
    id_identificacao INT NOT NULL,
    q1 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q2 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q3 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q4 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q5 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q6 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q7 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q8 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q9 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q10 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q11 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q12 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q13 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q14 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q15 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q16 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q17 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q18 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q19 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q20 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q21 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q22 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q23 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q24 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q25 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q26 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q27 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q28 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q29 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q30 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q31 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q32 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q33 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q34 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q35 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q36 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q37 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q38 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q39 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q40 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q41 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q42 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q43 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q44 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q45 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    q46 ENUM('sempre', 'raramente', 'frequentemente', 'nunca', 'às vezes'),
    FOREIGN KEY (id_identificacao) REFERENCES identificacao(id)
);

-- Permissões do usuário ADM
CREATE USER 'adm'@'localhost' IDENTIFIED BY 'pgr17012025'; -- Usuário criado
GRANT SELECT, INSERT, UPDATE, DELETE, ALTER, CREATE, DROP ON automacao_csv.* TO 'adm'@'localhost'; -- Atribuir permissões
FLUSH PRIVILEGES; -- Atualizar permissões

-- Permissões do usuário USER
CREATE USER 'user'@'localhost' IDENTIFIED BY 'pgr2025';
GRANT SELECT, INSERT, UPDATE, DELETE, ON automacao_csv.* TO 'user'@'localhost';
FLUSH PRIVILEGES;

-- Permissões do usuário READONLY_USER
CREATE USER 'readonly_user'@'localhost' IDENTIFIED BY 'pgr';
GRANT SELECT ON automacao_csv.* TO 'readonly_user'@'localhost';
FLUSH PRIVILEGES;
