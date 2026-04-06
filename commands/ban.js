const Discord = require("discord.js");
const logger = require("../utils/logger");

module.exports = {
  name: "ban",
  description: "Bannir un membre du serveur",
  permission: Discord.PermissionFlagsBits.BanMembers,
  dm: false,
  category: "Modération",
  options: [
    {
      type: Discord.ApplicationCommandOptionType.User,
      name: "membre",
      description: "Le membre à bannir",
      required: true,
    },
    {
      type: Discord.ApplicationCommandOptionType.String,
      name: "raison",
      description: "Raison du bannissement",
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
        content: "❌ Utilisateur introuvable.",
        ephemeral: true,
      });

    // Sécurité Hiérarchie : Modérateur > Cible
    if (
      interaction.member.roles.highest.comparePositionTo(
        member.roles.highest,
      ) <= 0 &&
      interaction.guild.ownerId !== interaction.user.id
    ) {
      return interaction.reply({
        content: "❌ Ton rôle est trop bas pour bannir ce membre.",
        ephemeral: true,
      });
    }

    // Sécurité Hiérarchie : Bot > Cible
    if (
      interaction.guild.members.me.roles.highest.comparePositionTo(
        member.roles.highest,
      ) <= 0
    ) {
      return interaction.reply({
        content:
          "❌ Mon rôle est trop bas pour bannir ce membre. Placez mon rôle plus haut.",
        ephemeral: true,
      });
    }

    if (!member.bannable)
      return interaction.reply({
        content: "❌ Je ne peux pas bannir ce membre.",
        ephemeral: true,
      });

    try {
      await member.ban({ reason: `${interaction.user.tag} : ${reason}` });

      // Appel au système de logs
      await logger(
        bot,
        interaction.guild,
        "Ban",
        interaction.user,
        user,
        reason,
      );

      return interaction.reply({
        content: `✅ **${user.tag}** a été banni avec succès.`,
      });
    } catch (err) {
      console.error(err);
      return interaction.reply({
        content: "❌ Une erreur est survenue lors du bannissement.",
        ephemeral: true,
      });
    }
  },
};
