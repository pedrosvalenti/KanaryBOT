const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remcargo')
    .setDescription('Remove um cargo de um membro (somente proprietário do bot)')
    .addUserOption(opt => opt.setName('membro').setDescription('Membro que perderá o cargo').setRequired(true))
    .addRoleOption(opt => opt.setName('cargo').setDescription('Cargo a ser removido').setRequired(true)),

  /**
   * @param {import('discord.js').CommandInteraction} interaction
   */
  async execute(interaction) {
    const OWNER_ID = '930958576279760947';

    // Somente o proprietário pode usar
    if (interaction.user.id !== OWNER_ID) {
      return interaction.reply({ content: 'Apenas o proprietário do bot pode usar este comando.', ephemeral: true });
    }

    if (!interaction.guild) {
      return interaction.reply({ content: 'Este comando só pode ser usado em servidores.', ephemeral: true });
    }

    // Obtém membro e cargo das opções
    let member = interaction.options.getMember('membro');
    const role = interaction.options.getRole('cargo');

    // Se member não estiver no cache (pouco comum) tenta buscar
    if (!member) {
      try {
        member = await interaction.guild.members.fetch(interaction.options.getUser('membro').id);
      } catch (err) {
        return interaction.reply({ content: 'Não foi possível encontrar o membro no servidor.', ephemeral: true });
      }
    }

    if (!role) {
      return interaction.reply({ content: 'Cargo inválido.', ephemeral: true });
    }

    // Permissões do bot
    const me = interaction.guild.members.me;
    if (!me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return interaction.reply({ content: 'Não tenho permissão para gerenciar cargos (Manage Roles).', ephemeral: true });
    }

    // Verifica se o cargo é gerenciado por integração (não removível manualmente)
    if (role.managed) {
      return interaction.reply({ content: 'Esse cargo é gerenciado por uma integração e não pode ser removido manualmente.', ephemeral: true });
    }

    // Verifica hierarquia de cargos (bot precisa ter cargo superior ao cargo que vai remover)
    if (role.position >= me.roles.highest.position) {
      return interaction.reply({ content: 'Não posso remover esse cargo porque ele é igual ou superior ao meu cargo mais alto.', ephemeral: true });
    }

    // Verifica se o membro tem o cargo
    if (!member.roles.cache.has(role.id)) {
      return interaction.reply({ content: `${member.user.tag} não possui o cargo **${role.name}**.`, ephemeral: true });
    }

    // Tenta remover cargo e responde com embed para resultado profissional
    try {
      await member.roles.remove(role, `Cargo removido por ${interaction.user.tag} via /remcargo`);

      const successEmbed = new EmbedBuilder()
        .setTitle('Cargo removido')
        .setColor(0xED4245) // vermelho
        .setDescription(`O cargo **${role.name}** foi removido com sucesso.`)
        .addFields(
          { name: 'Membro', value: `${member.user.tag} (<@${member.id}>)`, inline: true },
          { name: 'Cargo', value: `${role.name}`, inline: true },
          { name: 'Por', value: `${interaction.user.tag}`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: `ID: ${member.id}` });

      return interaction.reply({ embeds: [successEmbed] });
    } catch (err) {
      console.error('Erro ao remover cargo:', err);
      return interaction.reply({ content: 'Ocorreu um erro ao tentar remover o cargo. Verifique permissões e hierarquia.', ephemeral: true });
    }
  },
};