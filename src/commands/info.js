const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Mostra informação do usuário')
    .addUserOption(opt => opt
      .setName('user')
      .setDescription('Usuário a ser analisado')
      .setRequired(false)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('user') ?? interaction.user;
    const guild = interaction.guild;
    let member = null;
    if (guild) {
      try {
        member = await guild.members.fetch(user.id);
      } catch {
        member = null;
      }
    }

    const avatar = user.displayAvatarURL({ dynamic: true, size: 1024 });

    // Flags / Badges
    const flags = user.flags?.toArray?.() ?? [];
    const flagMap = {
      HOUSE_BRAVERY: 'HypeSquad Bravery',
      HOUSE_BRILLIANCE: 'HypeSquad Brilliance',
      HOUSE_BALANCE: 'HypeSquad Balance',
      EARLY_SUPPORTER: 'Apoiador Antigo',
      VERIFIED_BOT: 'Bot Verificado',
      VERIFIED_DEVELOPER: 'Desenvolvedor Verificado',
      DISCORD_EMPLOYEE: 'Funcionário Discord',
      PARTNER: 'Parceiro',
      BUG_HUNTER_LEVEL_1: 'Bug Hunter Lv.1',
      BUG_HUNTER_LEVEL_2: 'Bug Hunter Lv.2',
    };
    const friendlyFlags = flags.length ? flags.map(f => flagMap[f] ?? f).join(', ') : 'Nenhuma';

    // Roles
    let roles = 'Nenhuma';
    if (member) {
      const roleList = member.roles.cache
        .filter(r => r.id !== guild.id)
        .sort((a, b) => b.position - a.position)
        .map(r => r.toString());
      roles = roleList.length ? roleList.slice(0, 10).join(', ') + (roleList.length > 10 ? ` e mais ${roleList.length - 10}` : '') : 'Nenhuma';
    }

    // Presence / Activities — tenta vários fallbacks pois a Presence Intent pode estar desabilitada
    const presence = member?.presence ?? interaction.client?.presences?.cache?.get(user.id) ?? guild?.presences?.cache?.get?.(user.id) ?? null;
    const statusRaw = presence?.status ?? null;

    const statusMap = {
      online: '🟢 Online',
      idle: '🌙 Ausente',
      dnd: '⛔ Não incomodar',
      offline: '⚪ Offline',
      unknown: '⚪ Indisponível'
    };

    const statusLabel = statusRaw ? (statusMap[statusRaw] ?? statusRaw) : '⚪ Indisponível — verifique se a Presence Intent está ativada';

    const activities = presence?.activities ?? [];
    const activityTypeMap = {
      Playing: '🎮 Jogando',
      Listening: '🎧 Ouvindo',
      Watching: '📺 Assistindo',
      Custom: '💬 Status',
      Streaming: '📡 Transmitindo',
      Competing: '🏆 Competindo'
    };

    const activitiesString = activities.length
      ? activities.map(a => {
          const typeName = (activityTypeMap[a.type] || a.type || '').toString();
          // Custom status usually has state
          if (a.type === 'Custom' || a.type === 4) {
            return `💬 ${a.state ?? a.name ?? '—'}`;
          }
          const parts = [];
          if (typeName) parts.push(typeName);
          if (a.name) parts.push(a.name);
          if (a.details) parts.push(a.details);
          if (a.state && !a.details) parts.push(a.state);
          return parts.join(' — ');
        }).join('\n')
      : (presence ? 'Nenhuma' : 'Indisponível');

    const createdUnix = Math.floor(user.createdAt.getTime() / 1000);
    const joinedUnix = member?.joinedAt ? Math.floor(member.joinedAt.getTime() / 1000) : null;

    const selectedColor = (() => {
      try {
        const c = member?.displayHexColor;
        if (c && c !== '#000000') return c;
      } catch {}
      return 0x5865F2; // Discord blurple
    })();

    // Helpers para truncar campos longos (limite de 1024 por field)
    const safe = (s, limit = 1024) => {
      if (!s) return '—';
      if (s.length <= limit) return s;
      return s.slice(0, limit - 3) + '...';
    };

    const otherParts = [];
    if (member?.nickname) otherParts.push(`Apelido: **${member.nickname}**`);
    otherParts.push(`Maior cargo: **${member?.roles?.highest?.name ?? '—'}**`);
    if (member?.voice?.channel) otherParts.push(`Canal de voz: **${member.voice.channel.name}**`);
    if (member?.premiumSince) otherParts.push(`Boosting desde: ${new Date(member.premiumSince).toLocaleString('pt-BR')}`);
    const otherString = otherParts.join('\n') || '—';

    // Garantir que atividades e cargos não ultrapassem o limite do embed
    const activitiesValue = activitiesString ? safe(activitiesString, 1024) : '—';
    const rolesValue = safe(roles, 1024);

    // Construir embed com campos empilhados (uma informação por linha dentro dos fields)
    const embed = new EmbedBuilder()
      .setTitle(`Informações — ${user.tag}`)
      .setAuthor({ name: user.tag, iconURL: avatar })
      .setThumbnail(avatar)
      .setColor(selectedColor)
      .addFields(
        { name: '• Identificação', value: `**Usuário:** ${user}\n**Tag:** ${user.tag}\n**ID:** \`${user.id}\``, inline: false },
        { name: '• Status & Atividades', value: `**Estado:** ${statusLabel}\n**Atividades:**\n${activitiesValue}`, inline: false },
        { name: '• Datas', value: `**Conta criada:** <t:${createdUnix}:F> (<t:${createdUnix}:R>)\n**Entrou no servidor:** ${joinedUnix ? `<t:${joinedUnix}:F> (<t:${joinedUnix}:R>)` : 'Não é membro'}`, inline: false },
        { name: '• Badges', value: safe(friendlyFlags, 1024), inline: false },
        { name: `• Cargos (${member ? Math.max(member.roles.cache.size - 1, 0) : 0})`, value: rolesValue, inline: false },
        { name: '• Outros', value: safe(otherString, 1024), inline: false }
      )
      .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};