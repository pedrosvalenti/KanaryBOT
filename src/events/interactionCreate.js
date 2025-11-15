const { 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder 
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../commands/estrelas.json');

function loadData() {
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
}

function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {

    // BOTÃO -> abrir modal
    if (interaction.isButton()) {
      if (interaction.customId === 'alterar_banner') {

        const modal = new ModalBuilder()
          .setCustomId('modal_banner')
          .setTitle('Alterar banner do perfil');

        const urlInput = new TextInputBuilder()
          .setCustomId('banner_url')
          .setLabel('URL da nova imagem:')
          .setPlaceholder('https://exemplo.com/imagem.png')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const row = new ActionRowBuilder().addComponents(urlInput);
        modal.addComponents(row);

        return interaction.showModal(modal);
      }
    }

    // MODAL -> salvar imagem no JSON
    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'modal_banner') {
        const url = interaction.fields.getTextInputValue('banner_url');

        const data = loadData();

        if (!data[interaction.user.id]) {
          data[interaction.user.id] = { estrelas: 0 };
        }

        data[interaction.user.id].customBanner = url;
        saveData(data);

        return interaction.reply({
          content: `🖼️ Sua imagem de perfil foi alterada com sucesso!\nNova URL:\n${url}`,
          ephemeral: true,
        });
      }
    }
  }
};
