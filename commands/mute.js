const Discord = require("discord.js");
const ms = require("ms");
const logger = require("../utils/logger");

module.exports = {
  name: "mute",
  description: "Réduire un membre au silence (Timeout)",
  permission: Discord.PermissionFlagsBits.ModerateMembers,
  dm: false,
  category: "Modération",
  options: [
    {
      type: Discord.ApplicationCommandOptionType.User,
      name: "membre",
      description: "Le membre à mute",
      required: true,
    },
    {
      type: Discord.ApplicationCommandOptionType.String,
      name: "temps",
      description: "Durée (ex: 10m, 1h, 1d)",
      required: true,
    },
    {
      type: Discord.ApplicationCommandOptionType.String,
      name: "raison",
      description: "Raison du mute",
      required: false,
    },
  ],

  async run(bot, interaction) {
    const user = interaction.options.getUser("membre");
    const timeStr = interaction.options.getString("temps");
    const reason =
      interaction.options.getString("raison") || "Pas de raison fournie.";
    const member = interaction.guild.members.cache.get(user.id);

    if (!member)
      return interaction.reply({
        content: "❌ Membre introuvable.",
        ephemeral: true,
      });

    const duration = ms(timeStr);
    if (!duration || isNaN(duration))
      return interaction.reply({
        content: "❌ Format de temps invalide (utilisez : 10m, 1h, 1d).",
        ephemeral: true,
      });
    if (duration > 2419200000)
      return interaction.reply({
        content: "❌ Le mute ne peut pas dépasser 28 jours.",
        ephemeral: true,
      });

    if (
      interaction.member.roles.highest.comparePositionTo(
        member.roles.highest,
      ) <= 0 &&
      interaction.guild.ownerId !== interaction.user.id
    ) {
      return interaction.reply({
        content: "❌ Ton rôle est trop bas pour mute ce membre.",
        ephemeral: true,
      });
    }

    if (!member.moderatable)
      return interaction.reply({
        content: "❌ Je ne peux pas mute ce membre.",
        ephemeral: true,
      });

    try {
      await member.timeout(duration, `${interaction.user.tag} : ${reason}`);

      await logger(
        bot,
        interaction.guild,
        "Mute",
        interaction.user,
        user,
        `Durée: ${timeStr} | Raison: ${reason}`,
      );

      return interaction.reply({
        content: `✅ **${user.tag}** a été réduit au silence pour **${timeStr}**.`,
      });
    } catch (err) {
      console.error(err);
      return interaction.reply({
        content: "❌ Impossible de mute ce membre.",
        ephemeral: true,
      });
    }
  },
};
 