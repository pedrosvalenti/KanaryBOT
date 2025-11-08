const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

// Lista de GIFs de beijo - adicione mais URLs conforme desejar
const kissGifs = [
    'https://i.gifer.com/i0I.gif',
    'https://i.gifer.com/i0I.gif',
    'https://i.gifer.com/i0I.gif',
    'https://i.gifer.com/i0I.gif',
    'https://i.gifer.com/i0I.gif',
    'https://i.gifer.com/i0I.gif',
    'https://i.gifer.com/i0I.gif',
    'https://i.gifer.com/i0I.gif'
];

// Função para pegar um GIF aleatório da lista
function getRandomGif() {
    return kissGifs[Math.floor(Math.random() * kissGifs.length)];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('beijar')
    .setDescription('Beija um membro!')
    .addUserOption(option => 
      option.setName('membro')
        .setDescription('O membro que você quer beijar')
        .setRequired(true)),
  async execute(interaction) {
    const member = interaction.options.getUser('membro');
    
    // Verifica se o usuário está tentando se beijar
    if (member.id === interaction.user.id) {
      return interaction.reply({ content: 'Você não pode se beijar!', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor('#ff69b4')
      .setDescription(`<@${interaction.user.id}> beijou <@${member.id}>!`)
      .setImage(getRandomGif())

    await interaction.reply({ embeds: [embed] });
  },
};