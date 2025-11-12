require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  Collection, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder, 
  ActivityType // ← Importante pra definir o tipo de status
} = require('discord.js');

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
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
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

  // ✅ Define status personalizado com "Assistindo **Pedrozzy**"
  client.user.setPresence({
    activities: [
      { name: 'Assistindo **Pedrozzy**', type: 4 } // 4 = CUSTOM STATUS
    ],
    status: 'online' // opções: online, idle, dnd, invisible
  });

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

      if (id === 'ping_info') {
        await interaction.reply({ content: `Bot: ${client.user.tag}\nUptime: ${Math.floor(process.uptime())}s`, ephemeral: true });
        return;
      }

      if (id === 'counter_inc') {
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

      await interaction.reply({ content: `Botão ${id} clicado (handler padrão).`, ephemeral: true });
      return;
    }

    if (interaction.isStringSelectMenu && interaction.isStringSelectMenu()) {
      await interaction.reply({ content: `Você selecionou: ${interaction.values.join(', ')}`, ephemeral: true });
      return;
    }

    if (interaction.isModalSubmit && interaction.isModalSubmit()) {
      await interaction.reply({ content: `Modal recebido: ${interaction.customId}`, ephemeral: true });
      return;
    }
  } catch (err) {
    console.error('Erro ao processar interação:', err);
    if (!interaction.replied && !interaction.deferred) {
      try { 
        await interaction.reply({ content: 'Ocorreu um erro ao executar a interação.', ephemeral: true }); 
      } catch(e){}
    }
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.mentions.has(client.user)) {
    const comandosPermitidos = Array.from(client.commands.values())
      .filter(cmd => !['kick', 'ban', 'addemoji', 'addcargo', 'remcargo'].includes(cmd.data.name))
      .map(cmd => `</${cmd.data.name}:${cmd.data.id || '0'}> — ${cmd.data.description || 'Sem descrição'}`)
      .join('\n');

    const embed = new EmbedBuilder()
      .setColor(0x00AE86)
      .setTitle('📜 Comandos Disponíveis')
      .setDescription(comandosPermitidos || 'Nenhum comando disponível para usuários.')
      .setFooter({ text: `Solicitado por ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    try {
      await message.author.send({ embeds: [embed] });
      await message.reply({ content: '📬 Te enviei uma mensagem privada com os comandos disponíveis!', allowedMentions: { repliedUser: false } });
    } catch {
      await message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
    }
  }
});

client.login(token);
