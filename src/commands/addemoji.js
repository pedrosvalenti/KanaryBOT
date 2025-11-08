const { SlashCommandBuilder } = require('discord.js');
const { PermissionsBitField } = require('discord.js');

module.exports = {
   data: new SlashCommandBuilder()
      .setName('addemoji')
      .setDescription('Adiciona um emoji personalizado ao servidor.')
      .addStringOption(option =>
         option.setName('nome')
            .setDescription('Nome do novo emoji')
            .setRequired(true))
      .addAttachmentOption(option =>
         option.setName('imagem')
            .setDescription('Imagem do emoji (PNG, JPG, GIF)')
            .setRequired(true)),
   async execute(interaction) {
      const staffRoleId = '1384608139801923701';
      const member = interaction.member;

      // Verifica se o usuário possui o cargo de staff
      if (!member.roles.cache.has(staffRoleId)) {
         return interaction.reply({ content: 'Você não tem permissão para usar este comando.', ephemeral: true });
      }

      // Verifica permissão do bot
      if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageEmojisAndStickers)) {
         return interaction.reply({ content: 'Eu preciso da permissão de Gerenciar Emojis e Figurinhas.', ephemeral: true });
      }

      const nome = interaction.options.getString('nome');
      const imagem = interaction.options.getAttachment('imagem');

      // Verifica se o arquivo é uma imagem válida
      if (!imagem.contentType.startsWith('image/')) {
         return interaction.reply({ content: 'Por favor, envie um arquivo de imagem válido (PNG, JPG, GIF).', ephemeral: true });
      }

      try {
         const emoji = await interaction.guild.emojis.create({
            attachment: imagem.url,
            name: nome
         });
         return interaction.reply({ content: `Emoji adicionado com sucesso: <:${emoji.name}:${emoji.id}>`, ephemeral: false });
      } catch (error) {
         return interaction.reply({ content: `Erro ao adicionar o emoji: ${error.message}`, ephemeral: true });
      }
   }
};