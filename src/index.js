require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Partials, Collection, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID; // opcional para registro rápido em dev

if (!token) {
  console.error('Faltando DISCORD_TOKEN no .env. Copie .env.example para .env e preencha.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences
  ],
  partials: [Partials.Channel]
});

client.commands = new Collection();

// Carrega comandos slash da pasta src/commands
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if (command && command.data) {
      client.commands.set(command.data.name, command);
    }
  }
}

client.once('ready', async () => {
  console.log(`Logado como ${client.user.tag}`);

  // Registra comandos rapidamente em uma guild de desenvolvimento se GUILD_ID for fornecido
  try {
    if (guildId) {
      const guild = await client.guilds.fetch(guildId);
      if (guild) {
        const cmds = Array.from(client.commands.values()).map(c => c.data.toJSON());
        await guild.commands.set(cmds);
        console.log(`Comandos registrados na guild ${guildId}`);
      }
    } else {
      console.log('GUILD_ID não definido. Para registro rápido em dev defina GUILD_ID no .env.');
    }
  } catch (err) {
    console.warn('Erro ao registrar comandos na guild (sem problemas, pode registrar manualmente):', err.message);
  }
});

client.on('interactionCreate', async interaction => {
  try {
    // Slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction);
      return;
    }

    // Buttons
    if (interaction.isButton()) {
      const id = interaction.customId;

      // Ping info button
      if (id === 'ping_info') {
        await interaction.reply({ content: `Bot: ${client.user.tag}\nUptime: ${Math.floor(process.uptime())}s`, ephemeral: true });
        return;
      }

      // Counter increment: atualiza a mensagem original com novo contador
      if (id === 'counter_inc') {
        // Mensagem original contém 'Contador: N'
        const msg = interaction.message;
        const match = msg.content.match(/Contador:\s*(\d+)/i);
        let count = 0;
        if (match) count = parseInt(match[1], 10);
        count++;
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('counter_inc').setLabel('Incrementar').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('counter_reset').setLabel('Resetar').setStyle(ButtonStyle.Secondary)
        );
        await interaction.update({ content: `Contador: ${count}`, components: [row] });
        return;
      }

      if (id === 'counter_reset') {
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('counter_inc').setLabel('Incrementar').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('counter_reset').setLabel('Resetar').setStyle(ButtonStyle.Secondary)
        );
        await interaction.update({ content: `Contador: 0`, components: [row] });
        return;
      }

      // Qualquer outro botão personalizado
      await interaction.reply({ content: `Botão ${id} clicado (handler padrão).`, ephemeral: true });
      return;
    }

    // Select menus (se usados no futuro)
    if (interaction.isStringSelectMenu && interaction.isStringSelectMenu()) {
      await interaction.reply({ content: `Você selecionou: ${interaction.values.join(', ')}`, ephemeral: true });
      return;
    }

    // Modals (se usados no futuro)
    if (interaction.isModalSubmit && interaction.isModalSubmit()) {
      await interaction.reply({ content: `Modal recebido: ${interaction.customId}`, ephemeral: true });
      return;
    }
  } catch (err) {
    console.error('Erro ao processar interação:', err);
    if (interaction.replied || interaction.deferred) {
      // nada
    } else {
      try { await interaction.reply({ content: 'Ocorreu um erro ao executar a interação.', ephemeral: true }); } catch(e){}
    }
  }
});

client.login(token);
