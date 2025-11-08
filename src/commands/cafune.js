const { SlashCommandBuilder } = require('@discordjs/builders');
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

// Lista de GIFs de cafuné
const cafuneGifs = [
  'https://pa1.aminoapps.com/6543/0e2330bbbd1eb91f6f38abfcb2ea20c65c44edad_hq.gif',
  'https://media.tenor.com/yir7v3CeJnIAAAAM/loli.gif',
  'https://pa1.aminoapps.com/6723/a62c58fa264cb92a3ba5b2f50446a0541307e528_hq.gif'
];

// Função para pegar um GIF aleatório
function getRandomGif() {
  return cafuneGifs[Math.floor(Math.random() * cafuneGifs.length)];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cafuné')
    .setDescription('Faça carinho em um membro!')
    .addUserOption(option =>
      option.setName('membro')
        .setDescription('O membro que você quer acariciar')
        .setRequired(true)
    ),

  async execute(interaction) {
    const member = interaction.options.getUser('membro');

    if (member.id === interaction.user.id) {
      return interaction.reply({
        content: 'Você não pode se auto fazer carinho!',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor('#ff69b4')
      .setDescription(`<@${interaction.user.id}> fez cafuné em <@${member.id}>! 🩷`)
      .setImage(getRandomGif());

    // Cria o botão "Retribuir"
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('retribuir')
        .setLabel('Retribuir 💞')
        .setStyle(ButtonStyle.Primary)
    );

    // Envia o embed com o botão
    await interaction.reply({ embeds: [embed], components: [row] });

    // Coletor de interação do botão
    const sent = await interaction.fetchReply();
    const collector = sent.createMessageComponentCollector({ time: 60_000 }); // 60s

    collector.on('collect', async i => {
      if (i.customId !== 'retribuir') return;

      if (i.user.id !== member.id) {
        return i.reply({
          content: 'Apenas o membro que recebeu o cafuné pode retribuir!',
          ephemeral: true
        });
      }

      // Resposta de retribuição
      const replyEmbed = new EmbedBuilder()
        .setColor('#ff69b4')
        .setDescription(`<@${member.id}> retribuiu o cafuné em <@${interaction.user.id}>! 💖`)
        .setImage(getRandomGif())
        .setTimestamp();

      await i.update({ embeds: [replyEmbed], components: [] });
      collector.stop('used');
    });

    collector.on('end', async (collected, reason) => {
      if (reason === 'used') return;
      // Desabilita o botão após o tempo expirar
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('retribuir')
          .setLabel('Retribuir 💞')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true)
      );
      try {
        await interaction.editReply({ components: [disabledRow] });
      } catch (err) {
        // ignora erros (mensagem deletada, etc)
      }
    });
  },
};
