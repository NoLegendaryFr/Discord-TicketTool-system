const Discord = require("discord.js");
const logger = require("../utils/logger");

module.exports = {
  name: "unban",
  description: "Débannir un membre du serveur",
  permission: Discord.PermissionFlagsBits.BanMembers,
  dm: false,
  category: "Modération",
  options: [
    {
      type: Discord.ApplicationCommandOptionType.User, // Utilisation de la constante correcte
      name: "utilisateur",
      description: "L'utilisateur à débannir",
      required: true,
    },
    {
      type: Discord.ApplicationCommandOptionType.String,
      name: "raison",
      description: "Raison du débannissement",
      required: false,
    },
  ],

  async run(bot, interaction) {
    const user = interaction.options.getUser("utilisateur");
    const reason =
      interaction.options.getString("raison") || "Pas de raison fournie";

    try {
      const bans = await interaction.guild.bans.fetch();
      if (!bans.has(user.id)) {
        return interaction.reply({
          content: "Cet utilisateur n'est pas banni.",
          ephemeral: true,
        });
      }

      await interaction.guild.members.unban(user.id, reason);

      // Appel du logger
      await logger(
        bot,
        interaction.guild,
        "Unban",
        interaction.user,
        user,
        reason,
      );

      return interaction.reply({
        content: `✅ ${user.tag} a été débanni par ${interaction.user}.`,
      });
    } catch (err) {
      return interaction.reply({
        content: "Impossible de débannir cet utilisateur.",
        ephemeral: true,
      });
    }
  },
};
