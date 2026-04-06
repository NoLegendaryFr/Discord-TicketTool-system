const {
  PermissionFlagsBits,
  ApplicationCommandOptionType,
  EmbedBuilder,
} = require("discord.js");
const db = require("../utils/database");
const logger = require("../utils/logger");

module.exports = {
  name: "restreindre",
  description: "Limite la visibilité du ticket à un rôle staff spécifique",
  permission: PermissionFlagsBits.ManageChannels,
  dm: false,
  options: [
    {
      type: ApplicationCommandOptionType.Role,
      name: "role",
      description: "Le seul rôle staff qui pourra voir ce ticket",
      required: true,
    },
  ],

  async run(bot, interaction) {
    const config = db.readData("configTickets.json");
    const selectedRole = interaction.options.getRole("role");

    // Ta vérification de sécurité actuelle
    const isStaff =
      config.staffRoles?.some((r) =>
        interaction.member.roles.cache.has(r.id),
      ) ||
      interaction.member.permissions.has(PermissionFlagsBits.Administrator);

    if (!isStaff)
      return interaction.reply({
        content: "❌ Vous n'avez pas la permission.",
        ephemeral: true,
      });

    await interaction.deferReply();

    try {
      // Ta boucle actuelle pour cacher le ticket aux autres staffs
      if (config.staffRoles) {
        for (const staff of config.staffRoles) {
          await interaction.channel.permissionOverwrites.edit(staff.id, {
            ViewChannel: false,
          });
        }
      }

      // Réautoriser le rôle sélectionné
      await interaction.channel.permissionOverwrites.edit(selectedRole.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
      });

      const embed = new EmbedBuilder()
        .setTitle("🔒 Visibilité Restreinte")
        .setDescription(
          `Le ticket est désormais réservé au rôle **${selectedRole.name}**.`,
        )
        .setColor("#ff0000")
        .setTimestamp();

      // Ajout du LOGGER
      await logger(
        bot,
        interaction.guild,
        "Restriction Ticket",
        interaction.user,
        interaction.user,
        `Ticket restreint au rôle : ${selectedRole.name}`,
      );

      return interaction.editReply({ embeds: [embed] });
    } catch (e) {
      return interaction.editReply({
        content: "❌ Erreur lors du changement de permissions.",
      });
    }
  },
};
