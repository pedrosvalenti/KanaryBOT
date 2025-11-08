# KanaryBOT — Exemplo de bot Discord (JavaScript)

Este é um scaffold mínimo de bot Discord em JavaScript usando `discord.js` e demonstrando o uso de Componentes (botões, select, modal) em vez de embeds.

## O que tem aqui
- `src/index.js` — inicialização do client, carregamento de comandos e handlers de interações (buttons, selects).
- `src/commands/ping.js` — comando `/ping` que responde com botões (components) em vez de embed.
- `src/commands/components.js` — demonstração de contador atualizado por botões e select menu.
- `.env.example` — exemplo de variáveis de ambiente.

## Pré-requisitos
- Node.js 18+ (recomendado)
- Uma aplicação bot criada no Discord Developer Portal com o token e intent `applications.commands` ativada.

## Instalação (PowerShell)

Abra PowerShell na pasta do projeto e execute:

```powershell
npm install
# instale a versão mais recente do discord.js se desejar explicitamente:
# npm install discord.js@latest
```

Copie `.env.example` para `.env` e preencha:

```
DISCORD_TOKEN=seu_token_aqui
CLIENT_ID=seu_client_id_aqui
GUILD_ID=opcional_id_da_guild_para_registro_rapido
```

> Se você definir `GUILD_ID` no `.env`, os comandos serão registrados automaticamente nessa guild quando o bot iniciar (útil em desenvolvimento). Caso contrário, registre os comandos manualmente (ou via script separado).

## Rodando

```powershell
npm start
```

