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
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActivityType
} = require('discord.js');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token) {
  console.error('Faltando DISCORD_TOKEN no .env.');
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

// Caminho do JSON usado pelo /perfil
const DATA_PATH = path.join(__dirname, 'commands', 'estrelas.json');

// Funções de banco
function loadData() {
  if (!fs.existsSync(DATA_PATH)) fs.writeFileSync(DATA_PATH, JSON.stringify({}));
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
}

function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}


// --------- CARREGAR COMANDOS ----------
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

// ----------- READY EVENT --------------
client.once('ready', async () => {
  console.log(`Logado como ${client.user.tag}`);

  client.user.setPresence({
    activities: [
      { name: 'Assistindo o Pedrozzy', type: 4 }
    ],
    status: 'online'
  });

  try {
    if (guildId) {
      const guild = await client.guilds.fetch(guildId);
      if (guild) {
        const cmds = Array.from(client.commands.values()).map(c => c.data.toJSON());
        await guild.commands.set(cmds);
        console.log(`Comandos registrados na guild ${guildId}`);
      }
    }
  } catch (err) {
    console.warn('Erro ao registrar comandos:', err.message);
  }
});


// ------------ INTERAÇÕES ---------------
client.on('interactionCreate', async interaction => {
  try {

    // -------- SLASH COMMANDS --------
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction);
      return;
    }

    // -------- BOTÕES --------
    if (interaction.isButton()) {

      const id = interaction.customId;

      // 🖼️ BOTÃO "alterar banner"
      if (id === 'alterar_banner') {

        const modal = new ModalBuilder()
          .setCustomId('modal_banner')
          .setTitle('Alterar Banner do Perfil');

        const urlInput = new TextInputBuilder()
          .setCustomId('banner_url')
          .setLabel('URL da nova imagem')
          .setPlaceholder('https://exemplo.com/imagem.png')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const row = new ActionRowBuilder().addComponents(urlInput);
        modal.addComponents(row);

        return interaction.showModal(modal);
      }

      // -------- outros botões seus ----------
      if (id === 'ping_info') {
        await interaction.reply({ content: `Bot: ${client.user.tag}\nUptime: ${Math.floor(process.uptime())}s`, ephemeral: true });
        return;
      }

      if (id === 'counter_inc') {
        const msg = interaction.message;
        const match = msg.content.match(/Contador:\s*(\d+)/i);
        let count = match ? parseInt(match[1], 10) : 0;
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

      await interaction.reply({ content: `Botão ${id} clicado.`, ephemeral: true });
      return;
    }

    // -------- SELECT MENUS --------
    if (interaction.isStringSelectMenu()) {
      await interaction.reply({ content: `Você selecionou: ${interaction.values.join(', ')}`, ephemeral: true });
      return;
    }

    // -------- MODAL BANNER --------
    if (interaction.isModalSubmit()) {

      if (interaction.customId === 'modal_banner') {
        const bannerUrl = interaction.fields.getTextInputValue('banner_url');

        const data = loadData();
        if (!data[interaction.user.id]) data[interaction.user.id] = { estrelas: 0 };

        data[interaction.user.id].customBanner = bannerUrl;
        saveData(data);

        return interaction.reply({
          content: `🖼️ Seu banner foi atualizado!\nNova imagem:\n${bannerUrl}`,
          ephemeral: true,
        });
      }

      await interaction.reply({ content: `Modal: ${interaction.customId}`, ephemeral: true });
      return;
    }

  } catch (err) {
    console.error('Erro ao processar interação:', err);
    if (!interaction.replied && !interaction.deferred) {
      try {
        await interaction.reply({ content: 'Ocorreu um erro na interação.', ephemeral: true });
      } catch {}
    }
  }
});


// ----------- MENTION HELP ---------------
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
      .setDescription(comandosPermitidos || 'Nenhum comando disponível.')
      .setFooter({ text: `Solicitado por ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    try {
      await message.author.send({ embeds: [embed] });
      await message.reply({ content: '📬 Te enviei uma DM com os comandos!', allowedMentions: { repliedUser: false } });
    } catch {
      await message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
    }
  }
});

client.login(token);
