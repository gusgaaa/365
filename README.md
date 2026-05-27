# Copa 365 — Site integrado com Google Sheets

Site minimalista da Copa 365 já conectado aos links CSV enviados.

## Como colocar no GitHub Pages

1. Extraia o ZIP.
2. Entre na pasta `copa365_github_integrado`.
3. Suba todos os arquivos para um repositório no GitHub:
   - `index.html`
   - pasta `assets`
   - pasta `dados`
   - `README.md`
4. No GitHub, vá em `Settings > Pages`.
5. Em `Branch`, selecione `main` e `/root`.
6. Salve e aguarde o GitHub gerar o link.

## Onde estão os links da planilha

Os links ficam em:

`assets/config.js`

Eles já estão preenchidos:

- Jogadores: aba publicada como CSV
- Partidas: aba publicada como CSV

## Como atualizar o campeonato

Atualize os dados direto no Google Sheets. O site vai buscar os dados publicados em CSV.

Caso demore para aparecer no site, atualize com `Ctrl + F5` ou abra em uma aba anônima.

## Observação

A pasta `dados` fica como backup local, mas o site está configurado para priorizar os links do Google Sheets.
