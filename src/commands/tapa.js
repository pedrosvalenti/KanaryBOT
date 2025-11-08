const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// Lista de GIFs para o comando de tapa - adicione mais URLs conforme desejar
const slapGifs = [
    'https://i.pinimg.com/originals/b9/74/54/b97454d61d518852bef17e40703bb3fe.gif',
    'https://gifdb.com/images/high/anime-girl-slapping-funny-romance-cgvlonw265kjn0r6.gif',
    'https://i.pinimg.com/originals/65/57/f6/6557f684d6ffcd3cd4558f695c6d8956.gif'
];

// Função para pegar um GIF aleatório da lista
function getRandomGif() {
  return slapGifs[Math.floor(Math.random() * slapGifs.length)];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tapa')
    .setDescription('Estapeie um membro!')
    .addUserOption(option =>
      option.setName('membro')
        .setDescription('O membro que você quer estapear')
        .setRequired(true)),
  async execute(interaction) {
    const member = interaction.options.getUser('membro');
    
    // Não permitir que o usuário se ataque
    if (member.id === interaction.user.id) {
      return interaction.reply({ content: 'Você não pode se bater!', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor('#ff69b4')
      .setDescription(`<@${interaction.user.id}> deu um tapa em <@${member.id}>!`)
      .setImage(getRandomGif())
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('retribuir')
        .setLabel('Retribuir')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ embeds: [embed], components: [row] });

    // Criar coletor para o botão — apenas o usuário alvo pode retribuir
    const sent = await interaction.fetchReply();
    const collector = sent.createMessageComponentCollector({ time: 120_000 }); // 60s

    collector.on('collect', async i => {
      if (i.customId !== 'retribuir') return;

      if (i.user.id !== member.id) {
        return i.reply({ content: 'Apenas o membro alvo pode retribuir este tapa.', ephemeral: true });
      }

      // Resposta de retribuição
      const replyEmbed = new EmbedBuilder()
        .setColor('#ff69b4')
        .setDescription(`<@${member.id}> retribuiu o tapa em <@${interaction.user.id}>!`)
        .setImage(getRandomGif())
        .setTimestamp();

      // Atualiza a mensagem original: mostra a retribuição e remove o botão
      await i.update({ embeds: [replyEmbed], components: [] });
      collector.stop('used');
    });

    collector.on('end', async (collected, reason) => {
      if (reason === 'used') return; // já foi tratado
      // Desabilitar o botão após expirar
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('retribuir')
          .setLabel('Retribuir')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true)
      );
      try {
        await interaction.editReply({ components: [disabledRow] });
      } catch (err) {
        // ignorar erros de edição (mensagem deletada, por exemplo)
      }
    });
  },
};