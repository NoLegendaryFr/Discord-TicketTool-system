const { EmbedBuilder } = require("discord.js");
const db = require("./database");

module.exports = async (bot, guild, action, moderator, target, reason) => {
  // Lecture de la config via ton nouveau système
  const config = db.readData("configTickets.json");
  const logChannelId = config.logsChannel; // "logsChannel" avec un 's' comme dans ticketconfig.js

  if (!logChannelId) return;

  const channel = guild.channels.cache.get(logChannelId);
  if (!channel) return;

  const logEmbed = new EmbedBuilder()
    .setTitle(`Log : ${action}`)
    .setColor(action === "Ban" ? "#ff0000" : "#ffa500")
    .addFields(
      {
        name: "Modérateur",
        value: `${moderator.tag} (${moderator.id})`,
        inline: true,
      },
      { name: "Cible", value: `${target.tag} (${target.id})`, inline: true },
      { name: "Raison", value: reason || "Aucune raison fournie" },
    )
    .setTimestamp();

  channel.send({ embeds: [logEmbed] });
};
