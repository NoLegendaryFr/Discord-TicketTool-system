const { PermissionFlagsBits } = require("discord.js");
const logger = require("../utils/logger"); // Import du logger

module.exports = {
  name: "remove",
  description: "Retirer un membre du ticket",
  permissions: [PermissionFlagsBits.ManageThreads],
  options: [
    {
      type: 6,
      name: "membre",
      description: "Le membre à retirer",
      required: true,
    },
  ],

  async run(bot, interaction) {
    const member = interaction.options.getMember("membre");

    if (
      !interaction.channel
        .permissionsFor(member)
        .has(PermissionFlagsBits.ViewChannel)
    ) {
      return interaction.reply({
        content: "Ce membre n'est pas dans le ticket.",
        ephemeral: true,
      });
    }

    await interaction.channel.permissionOverwrites.delete(member);

    // Appel du logger
    await logger(
      bot,
      interaction.guild,
      "Retrait Ticket",
      interaction.user,
      member.user,
      `Retiré du salon : ${interaction.channel.name}`,
    );

    return interaction.reply({
      content: `${member} a été retiré du ticket.`,
      ephemeral: true,
    });
  },
};
 