@echo off

echo "Arquivos PDF salvos com sucesso!"
echo "Abrindo a pasta de destino... em 3 segundos."

timeout /t 3 >nul
explorer "E:\DEV_2025\arquivosPgr\pdf"
