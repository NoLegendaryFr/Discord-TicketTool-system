const {
  PermissionFlagsBits,
  ApplicationCommandOptionType,
  MessageFlags,
} = require("discord.js");
const logger = require("../utils/logger");

module.exports = {
  name: "add",
  description: "Ajouter un membre au ticket",
  permission: PermissionFlagsBits.ManageChannels,
  dm: false,
  category: "Modération",
  options: [
    {
      // Type USER : Affiche la liste des membres avec avatars nativement
      type: ApplicationCommandOptionType.User,
      name: "membre",
      description: "Le membre à ajouter au ticket",
      required: true,
    },
  ],

  async run(bot, interaction) {
    const user = interaction.options.getUser("membre");
    const member = interaction.options.getMember("membre");
    const { channel, guild } = interaction;

    // 1. Vérification : Est-ce que le membre est bien sur le serveur ?
    if (!member) {
      return interaction.reply({
        content: "❌ Ce membre n'est plus sur le serveur.",
        flags: [MessageFlags.Ephemeral],
      });
    }

    // 2. Sécurité : Ne pas s'ajouter soi-même ou un bot (optionnel)
    if (user.bot) {
      return interaction.reply({
        content: "❌ Vous ne pouvez pas ajouter un bot.",
        flags: [MessageFlags.Ephemeral],
      });
    }

    try {
      // 3. Mise à jour des permissions
      await channel.permissionOverwrites.edit(member.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
      });

      // 4. Log de l'action
      await logger(
        bot,
        guild,
        "Ajout Ticket",
        interaction.user,
        user,
        `Ajouté au salon : ${channel.name}`,
      );

      // 5. Réponse publique
      return interaction.reply({
        content: `✅ **${user.tag}** a été ajouté au ticket par ${interaction.user}.`,
      });
    } catch (error) {
      console.error("Erreur PermissionEdit:", error);
      return interaction.reply({
        content:
          "❌ Impossible de modifier les permissions. Vérifiez que mon rôle est assez haut !",
        flags: [MessageFlags.Ephemeral],
      });
    }
  },
};
 