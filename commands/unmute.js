const Discord = require("discord.js");
const logger = require("../utils/logger");

module.exports = {
  name: "unmute",
  description: "Enlever le timeout d'un membre",
  permission: Discord.PermissionFlagsBits.ModerateMembers,
  dm: false,
  category: "Modération",
  options: [
    {
      type: Discord.ApplicationCommandOptionType.User,
      name: "membre",
      description: "Le membre à unmute",
      required: true,
    },
    {
      type: Discord.ApplicationCommandOptionType.String,
      name: "raison",
      description: "La raison du unmute",
      required: false,
    },
  ],

  async run(bot, interaction) {
    const user = interaction.options.getUser("membre");
    const reason =
      interaction.options.getString("raison") || "Pas de raison fournie";
    const member = interaction.guild.members.cache.get(user.id);

    if (!member)
      return interaction.reply({
        content: "Membre introuvable.",
        ephemeral: true,
      });

    if (!member.moderatable) {
      return interaction.reply({
        content: "Je ne peux pas unmute ce membre (Permissions insuffisantes).",
        ephemeral: true,
      });
    }

    if (
      interaction.member.roles.highest.comparePositionTo(
        member.roles.highest,
      ) <= 0
    ) {
      return interaction.reply({
        content:
          "Vous ne pouvez pas unmute un membre supérieur ou égal à vous.",
        ephemeral: true,
      });
    }

    await member.timeout(null, reason);

    // Appel du logger
    await logger(
      bot,
      interaction.guild,
      "Unmute",
      interaction.user,
      user,
      reason,
    );

    return interaction.reply({
      content: `✅ ${user.tag} a été unmute par ${interaction.user}.`,
    });
  },
};
 