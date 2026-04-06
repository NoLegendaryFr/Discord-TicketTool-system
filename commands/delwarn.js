const Discord = require("discord.js");
const db = require("../utils/database");

module.exports = {
  name: "delwarn",
  description: "Supprime un avertissement via son ID",
  permission: Discord.PermissionFlagsBits.ManageMessages,
  dm: false,
  category: "Modération",
  options: [
    {
      type: Discord.ApplicationCommandOptionType.String,
      name: "id",
      description: "L'ID du warn (ex: WARN-1234)",
      required: true,
    },
  ],

  async run(bot, interaction) {
    const warnId = interaction.options.getString("id").toUpperCase();
    let allWarns = db.getWarns();
    let found = false;

    // On parcourt les serveurs -> les utilisateurs -> les warns
    for (const guildId in allWarns) {
      for (const userId in allWarns[guildId]) {
        const initialLength = allWarns[guildId][userId].length;
        allWarns[guildId][userId] = allWarns[guildId][userId].filter(w => w.id !== warnId);
        
        if (allWarns[guildId][userId].length < initialLength) {
          found = true;
          break;
        }
      }
    }

    if (!found) return interaction.reply({ content: "❌ Aucun warn trouvé avec cet ID.", ephemeral: true });

    db.saveWarns(allWarns);
    return interaction.reply({ content: `✅ Le warn **${warnId}** a été supprimé.` });
  }
};