const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, 'estrelas.json');
const COOLDOWN_HOURS = 24;
const REWARD_MIN = 10;
const REWARD_MAX = 30;

// Função para carregar ou inicializar o banco de dados
function loadData() {
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, JSON.stringify({}));
  }
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
}

// Função para salvar o banco de dados
function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('estrelas')
    .setDescription('Pegue suas estrelas diárias!'),
  async execute(interaction) {
    const userId = interaction.user.id;
    const data = loadData();

    const now = Date.now();
    const userData = data[userId] || { estrelas: 0, lastClaim: 0 };

    // Verifica cooldown
    if (now - userData.lastClaim < COOLDOWN_HOURS * 60 * 60 * 1000) {
      const nextClaim = userData.lastClaim + COOLDOWN_HOURS * 60 * 60 * 1000;
      const timeLeft = nextClaim - now;
      const hours = Math.floor(timeLeft / (60 * 60 * 1000));
      const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
      return interaction.reply({
        content: `⏳ Você já pegou suas estrelas hoje! Tente novamente em ${hours}h ${minutes}m.`,
        ephemeral: true
      });
    }

    // Sorteia a quantidade de estrelas
    const estrelasGanhas = Math.floor(Math.random() * (REWARD_MAX - REWARD_MIN + 1)) + REWARD_MIN;
    userData.estrelas += estrelasGanhas;
    userData.lastClaim = now;
    data[userId] = userData;
    saveData(data);

    return interaction.reply({
      content: `✨ Você recebeu **${estrelasGanhas}** estrelas! Agora você tem **${userData.estrelas}** estrelas.`,
      ephemeral: false
    });
  }
};