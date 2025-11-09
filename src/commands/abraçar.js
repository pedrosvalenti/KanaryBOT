const { SlashCommandBuilder } = require('@discordjs/builders');
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

// Lista de GIFs de beijo — adicione mais se quiser
const hugGifs = [
  'https://i.pinimg.com/originals/f2/80/5f/f2805f274471676c96aff2bc9fbedd70.gif',
  'https://i.pinimg.com/originals/c8/67/f6/c867f6e32eb7bc81760015dfc08f4d05.gif',
  'https://media.tenor.com/7f9CqFtd4SsAAAAM/hug.gif'
];

// Função para pegar um GIF aleatório
function getRandomGif() {
  return hugGifs[Math.floor(Math.random() * hugGifs.length)];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('abraçar')
    .setDescription('abraça um membro!')
    .addUserOption(option =>
      option.setName('membro')
        .setDescription('O membro que você quer abraçar')
        .setRequired(true)
    ),

  async execute(interaction) {
    const member = interaction.options.getUser('membro');

    // Verifica se o usuário está tentando se abraçar
    if (member.id === interaction.user.id) {
      return interaction.reply({
        content: 'Você não pode se abraçar!',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor('#ff69b4')
      .setDescription(`<@${interaction.user.id}> abraçou <@${member.id}>! 💋`)
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

    // Cria o coletor para o botão
    const sent = await interaction.fetchReply();
    const collector = sent.createMessageComponentCollector({ time: 120_000 });

    collector.on('collect', async i => {
      if (i.customId !== 'retribuir') return;

      if (i.user.id !== member.id) {
        return i.reply({
          content: 'Apenas o membro que recebeu o abraço pode retribuir!',
          ephemeral: true
        });
      }

      // Resposta de retribuição
      const replyEmbed = new EmbedBuilder()
        .setColor('#ff69b4')
        .setDescription(`<@${member.id}> retribuiu o abraço em <@${interaction.user.id}>! 💞`)
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
        // ignora erros se a mensagem foi apagada
      }
    });
  },
};
