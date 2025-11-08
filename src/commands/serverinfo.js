const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Mostra informações sobre o servidor'),

  async execute(interaction) {
    const server = interaction.guild;
    const owner = await server.fetchOwner();
    const createdTimestamp = Math.floor(server.createdTimestamp / 1000);
    const botCount = server.members.cache.filter(member => member.user.bot).size;
    const memberCount = server.memberCount - botCount;

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`📊 Informações do Servidor: ${server.name}`)
      .setThumbnail(server.iconURL({ dynamic: true }))
      .addFields(
        { name: '👑 Dono', value: `${owner.user.tag}`, inline: true },
        { name: '👥 Membros', value: `${memberCount}`, inline: true },
        { name: '🤖 Bots', value: `${botCount}`, inline: true },
        { name: '📝 Criado em', value: `<t:${createdTimestamp}:F>`, inline: false },
        { name: '🔰 ID do Servidor', value: server.id, inline: true },
        { name: '💬 Canais', value: `${server.channels.cache.size}`, inline: true },
        { name: '😀 Emojis', value: `${server.emojis.cache.size}`, inline: true },
        { name: '🎭 Cargos', value: `${server.roles.cache.size}`, inline: true },
        { name: '🌟 Boost Level', value: `${server.premiumTier}`, inline: true },
        { name: '📈 Boosts', value: `${server.premiumSubscriptionCount || '0'}`, inline: true }
      )
      .setFooter({ text: 'Informações do Servidor' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};