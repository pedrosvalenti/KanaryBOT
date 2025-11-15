const { SlashCommandBuilder } = require('discord.js');
const db = require('../utils/database'); // Supondo que você tenha um sistema de banco de dados

module.exports = {
  data: new SlashCommandBuilder()
    .setName('divorcio')
    .setDescription('Divorcie-se de alguém imediatamente, sem precisar de aceitação.')
    .addUserOption(option =>
      option.setName('membro')
        .setDescription('Membro para se divorciar')
        .setRequired(true)
    ),
  async execute(interaction) {
    const requester = interaction.user;
    const member = interaction.options.getUser('membro');

    if (member.id === requester.id) {
      return interaction.reply({ content: 'Você não pode se divorciar de si mesmo!', ephemeral: true });
    }

    // Verifica se existe casamento entre os dois
    const casamentoExistente = await db.getCasamento(requester.id, member.id);
    if (!casamentoExistente) {
      return interaction.reply({ content: 'Vocês não estão casados!', ephemeral: true });
    }

    // Remove o casamento do banco de dados
    await db.divorciar(requester.id, member.id);

    return interaction.reply({ content: `💔 ${requester} se divorciou de ${member}. O casamento acabou!` });
  },
};

// No arquivo utils/database.js, adicione a função divorciar:
// async function divorciar(id1, id2) {
//   // Carregue o arquivo casamentos.json, remova o casamento entre id1 e id2 (em qualquer ordem), e salve de volta.
// }