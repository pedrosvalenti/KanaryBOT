const { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle 
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, 'estrelas.json');

function loadData() {
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, JSON.stringify({}));
  }
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
}

function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('perfil')
    .setDescription('Veja seu perfil estiloso igual ao da Loritta!')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Veja o perfil de outro membro')
        .setRequired(false)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('usuario') || interaction.user;

    const data = loadData();
    const userData = data[user.id] || { estrelas: 0, customBanner: null };

    const userFetch = await interaction.client.users.fetch(user.id, { force: true });

    // Banner personalizado > banner do Discord > fallback
    let bannerURL =
      userData.customBanner ||
      userFetch.bannerURL({ extension: 'png', size: 2048 }) ||
      "https://raw.githubusercontent.com/AnzuzaDev/discord-defaults/main/banners/default-banner-1.png";

    const avatarURL = user.displayAvatarURL({ extension: 'png', size: 1024 });

    // CASAMENTO
    let casamentoInfo = '💔 Solteiro(a)';
    let tempoCasado = '';
    const casamentos = require('../utils/casamentos.json');
    const casamento = casamentos.find(c => c.proposer === user.id || c.member === user.id);

    if (casamento) {
      const parceiroId = casamento.proposer === user.id ? casamento.member : casamento.proposer;
      const parceiro = await interaction.client.users.fetch(parceiroId).catch(() => null);
      casamentoInfo = `💍 Casado(a) com ${parceiro ? `<@${parceiroId}>` : parceiroId}`;

      const diff = Date.now() - new Date(casamento.data).getTime();
      const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
      const horas = Math.floor((diff / (1000 * 60 * 60)) % 24);
      tempoCasado = `⏳ Juntos há **${dias} dias** e **${horas} horas**`;
    }

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setAuthor({ name: `${user.username}`, iconURL: avatarURL })
      .setThumbnail(avatarURL)
      .setImage(bannerURL)
      .addFields(
        { name: '⭐ Estrelas', value: `\`${userData.estrelas}\``, inline: true },
        { name: '❤️ Status Amoroso', value: casamentoInfo, inline: true },
        ...(tempoCasado
          ? [{ name: '⏳ Tempo de casamento', value: tempoCasado, inline: false }]
          : [])
      )
      .setFooter({ text: 'KanaryBOT • Perfil', iconURL: avatarURL })
      .setTimestamp();

    // Botão aparece apenas para o dono do perfil
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('alterar_banner')
        .setLabel('Alterar imagem do perfil')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🖼️')
        .setDisabled(user.id !== interaction.user.id)
    );

    await interaction.reply({
      embeds: [embed],
      components: [row],
    });
  }
};
