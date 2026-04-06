const Discord = require("discord.js");
const logger = require("../utils/logger");

module.exports = {
  name: "kick",
  description: "Expulser un membre du serveur",
  permission: Discord.PermissionFlagsBits.KickMembers,
  dm: false,
  category: "Modération",
  options: [
    {
      type: Discord.ApplicationCommandOptionType.User,
      name: "membre",
      description: "Le membre à kick",
      required: true,
    },
    {
      type: Discord.ApplicationCommandOptionType.String,
      name: "raison",
      description: "Raison de l'expulsion",
      required: false,
    },
  ],

  async run(bot, interaction) {
    const user = interaction.options.getUser("membre");
    const reason =
      interaction.options.getString("raison") || "Pas de raison fournie.";
    const member = interaction.guild.members.cache.get(user.id);

    if (!member)
      return interaction.reply({
        content: "❌ Membre introuvable.",
        ephemeral: true,
      });

    if (
      interaction.member.roles.highest.comparePositionTo(
        member.roles.highest,
      ) <= 0 &&
      interaction.guild.ownerId !== interaction.user.id
    ) {
      return interaction.reply({
        content: "❌ Ton rôle est trop bas pour kick ce membre.",
        ephemeral: true,
      });
    }

    if (
      interaction.guild.members.me.roles.highest.comparePositionTo(
        member.roles.highest,
      ) <= 0
    ) {
      return interaction.reply({
        content: "❌ Mon rôle est trop bas pour kick ce membre.",
        ephemeral: true,
      });
    }

    if (!member.kickable)
      return interaction.reply({
        content: "❌ Ce membre ne peut pas être expulsé.",
        ephemeral: true,
      });

    try {
      await user
        .send(
          `👟 Tu as été expulsé de **${interaction.guild.name}**\n**Raison :** ${reason}`,
        )
        .catch(() => {});
      await member.kick(`${interaction.user.tag} : ${reason}`);

      await logger(
        bot,
        interaction.guild,
        "Kick",
        interaction.user,
        user,
        reason,
      );

      return interaction.reply({
        content: `✅ **${user.tag}** a été expulsé.`,
      });
    } catch (err) {
      return interaction.reply({
        content: "❌ Erreur lors de l'expulsion.",
        ephemeral: true,
      });
    }
  },
};
 