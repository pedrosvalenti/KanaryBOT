const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bane um membro do servidor')
        .addUserOption(option =>
            option
                .setName('usuario')
                .setDescription('Usuário que será banido')
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('motivo')
                .setDescription('Motivo do banimento')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const autorizadoID = '930958576279760947'; // Seu ID
        const logChannelId = '1384608140686921896'; // Canal de logs

        if (interaction.user.id !== autorizadoID) {
            return interaction.reply({ content: '❌ Você não tem permissão para usar este comando.', ephemeral: true });
        }

        const user = interaction.options.getUser('usuario');
        const reason = interaction.options.getString('motivo') || 'Nenhum motivo informado';
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        if (!member) {
            return interaction.reply({ content: '❌ Usuário não encontrado no servidor.', ephemeral: true });
        }

        if (!member.bannable) {
            return interaction.reply({ content: '❌ Não consigo banir este membro. Ele pode ter um cargo maior que o meu.', ephemeral: true });
        }

        await member.ban({ reason });

        await interaction.reply({ content: `✅ ${user.tag} foi **banido** do servidor.`, ephemeral: true });

        // Embed de log
        const logEmbed = new EmbedBuilder()
            .setTitle('⛔ Membro Banido')
            .setColor('DarkRed')
            .addFields(
                { name: '👤 Usuário', value: `${user.tag} (${user.id})`, inline: true },
                { name: '🛡️ Banido por', value: `${interaction.user.tag}`, inline: true },
                { name: '📄 Motivo', value: reason, inline: false },
            )
            .setTimestamp();

        const logChannel = interaction.guild.channels.cache.get(logChannelId);
        if (logChannel) {
            await logChannel.send({ embeds: [logEmbed] });
        }
    },
};
