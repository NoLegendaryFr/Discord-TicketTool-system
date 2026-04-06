const Discord = require("discord.js");
const db = require("../utils/database");
const logger = require("../utils/logger");

module.exports = {
  name: "warn",
  description: "Avertir un membre",
  permission: Discord.PermissionFlagsBits.ManageMessages,
  dm: false,
  category: "Modération",
  options: [
    {
      type: Discord.ApplicationCommandOptionType.User,
      name: "membre",
      description: "Le membre à warn",
      required: true,
    },
    {
      type: Discord.ApplicationCommandOptionType.String,
      name: "raison",
      description: "Raison du warn",
      required: false,
    },
  ],

  async run(bot, interaction, args) {
    const user = args.getUser("membre");
    const reason = args.getString("raison") || "Pas de raison fournie.";
    const config = db.readData("configTickets.json");

    // Ta vérification de salon actuel
    if (config.warnChannel && interaction.channel.id !== config.warnChannel) {
      return interaction.reply({
        content: `❌ Commande à faire dans <#${config.warnChannel}>`,
        ephemeral: true,
      });
    }

    const member = interaction.guild.members.cache.get(user.id);
    if (!member)
      return interaction.reply({
        content: "Utilisateur introuvable.",
        ephemeral: true,
      });

    // Ta logique de hiérarchie actuelle
    if (
      interaction.member.roles.highest.comparePositionTo(
        member.roles.highest,
      ) <= 0
    ) {
      return interaction.reply({
        content: "❌ Hiérarchie insuffisante.",
        ephemeral: true,
      });
    }

    // Gestion des données via database.js
    let allWarns = db.readData("warnList.json");

    // Ton système de création d'ID
    const warnID = await bot.functions.createId("WARN");
    const newWarn = {
      id: warnID,
      authorId: interaction.user.id,
      authorTag: interaction.user.tag,
      reason: reason,
      date: Date.now(),
    };

    if (!allWarns[interaction.guild.id]) allWarns[interaction.guild.id] = {};
    if (!allWarns[interaction.guild.id][user.id])
      allWarns[interaction.guild.id][user.id] = [];

    allWarns[interaction.guild.id][user.id].push(newWarn);
    db.saveData("warnList.json", allWarns);

    // Ajout du LOGGER
    await logger(
      bot,
      interaction.guild,
      "Warn",
      interaction.user,
      user,
      reason,
    );

    return interaction.reply({
      content: `✅ **${user.tag}** a été warn pour : ${reason} (ID: ${warnID})`,
    });
  },
};
