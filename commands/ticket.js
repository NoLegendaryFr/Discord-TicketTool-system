const Discord = require("discord.js");
const fs = require("fs");
const logger = require("../utils/logger");
const path = "./configTickets.json";

module.exports = {
  name: "ticket",
  description: "Envoie l'embed pour ouvrir un ticket",
  permission: Discord.PermissionFlagsBits.ManageGuild,
  dm: false,
  category: "Modération",
  options: [],

  async run(bot, interaction) {
    let config = {
      mainEmbedTitle: "Titre a configurer via /ticketconfig main_pannel titre",
      mainEmbedDesc:
        "Titre a configurer via /ticketconfig main_pannel description",
      mainEmbedColor: "#ffd700",
      buttonLabel:
        "texte configurer via /ticketconfig main_pannel button_texte",
      buttonEmoji: "🎟️",
      buttonStyle: 4, // 1=Bleu, 2=Gris, 3=Vert, 4=Rouge
    };

    if (fs.existsSync(path)) {
      try {
        const data = fs.readFileSync(path, "utf8");
        if (data.trim()) config = { ...config, ...JSON.parse(data) };
      } catch (e) {
        console.error(e);
      }
    }

    const embed = new Discord.EmbedBuilder()
      .setColor(config.mainEmbedColor)
      .setTitle(config.mainEmbedTitle)
      .setDescription(config.mainEmbedDesc)
      .setFooter({ text: `TicketTool - créé par No_legendary_Fr` });

    const button = new Discord.ButtonBuilder()
      .setCustomId("create_ticket")
      .setLabel(config.buttonLabel)
      .setEmoji(config.buttonEmoji)
      .setStyle(config.buttonStyle);

    const row = new Discord.ActionRowBuilder().addComponents(button);

    // On récupère le salon configuré
    const targetChannel = interaction.guild.channels.cache.get(
      config.mainChannel,
    );

    if (!targetChannel) {
      return interaction.reply({
        content:
          "❌ Le salon du panneau n'est pas configuré ou est introuvable.",
        ephemeral: true,
      });
    }

    await targetChannel.send({ embeds: [embed], components: [row] });

    // 👈 APPEL DU LOGGER
    await logger(
      bot,
      interaction.guild,
      "Envoi Panneau Ticket",
      interaction.user,
      bot.user,
      `Panneau envoyé dans le salon : ${targetChannel.name}`,
    );

    return interaction.reply({
      content: `✅ Panneau envoyé avec succès dans ${targetChannel} !`,
      ephemeral: true,
    });
  },
};
 