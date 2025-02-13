/* CREDENCIAIS_Usuário_MySQL */

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
