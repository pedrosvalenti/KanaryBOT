const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Expulsa um membro do servidor')
        .addUserOption(option =>
            option
                .setName('usuario')
                .setDescription('Usuário que será expulso')
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('motivo')
                .setDescription('Motivo da expulsão')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        const autorizadoID = '930958576279760947';
        const logChannelId = '1384608140686921896';
        if (interaction.user.id !== autorizadoID) {
            return interaction.reply({ content: '❌ Você não tem permissão para usar este comando.', ephemeral: true });
        }

        const user = interaction.options.getUser('usuario');
        const reason = interaction.options.getString('motivo') || 'Nenhum motivo informado';
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        if (!member) {
            return interaction.reply({ content: '❌ Usuário não encontrado no servidor.', ephemeral: true });
        }

        if (!member.kickable) {
            return interaction.reply({ content: '❌ Não consigo expulsar este membro. Ele pode ter um cargo maior que o meu.', ephemeral: true });
        }

        await member.kick(reason);

        await interaction.reply({ content: `✅ ${user.tag} foi expulso do servidor.`, ephemeral: true });

        // Cria o embed de log
        const logEmbed = new EmbedBuilder()
            .setTitle('🚫 Membro Expulso')
            .setColor('Red')
            .addFields(
                { name: '👤 Usuário', value: `${user.tag} (${user.id})`, inline: true },
                { name: '🛡️ Expulso por', value: `${interaction.user.tag}`, inline: true },
                { name: '📄 Motivo', value: reason, inline: false },
            )
            .setTimestamp();

        const logChannel = interaction.guild.channels.cache.get(logChannelId);
        if (logChannel) {
            await logChannel.send({ embeds: [logEmbed] });
        }
    },
};
