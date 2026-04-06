const Discord = require("discord.js");
const fs = require("fs");
const pathWarns = "./warnList.json";
const pathConfig = "./configTickets.json";

module.exports = {
  name: "warnlist",
  description: "Affiche les warns d'un membre",
  permission: Discord.PermissionFlagsBits.ManageMessages,
  dm: false,
  category: "Modération",
  options: [
    {
      type: Discord.ApplicationCommandOptionType.User,
      name: "membre",
      description: "Le membre à surveiller",
      required: true,
    },
  ],

  async run(bot, interaction, args) {
    const user = args.getUser("membre");
    const guild = interaction.guild;

    // --- CHARGEMENT DE LA CONFIG POUR LE SALON ---
    let config = {};
    if (fs.existsSync(pathConfig)) {
      try {
        config = JSON.parse(fs.readFileSync(pathConfig, "utf8"));
      } catch (e) {
        console.error("Erreur lecture configTickets:", e);
      }
    }

    // Vérification du salon autorisé (si configuré dans ticketconfig)
    if (config.warnChannel && interaction.channel.id !== config.warnChannel) {
      return interaction.reply({
        content: `❌ Cette commande ne peut être utilisée que dans le salon <#${config.warnChannel}>.`,
        ephemeral: true,
      });
    }

    // --- 1. LECTURE DU FICHIER JSON DES WARNS ---
    if (!fs.existsSync(pathWarns)) {
      return interaction.reply({
        content: "❌ Aucun avertissement n'a encore été enregistré sur ce bot.",
        ephemeral: true,
      });
    }

    let allWarns = {};
    try {
      const data = fs.readFileSync(pathWarns, "utf8");
      allWarns = JSON.parse(data);
    } catch (e) {
      console.error(e);
      return interaction.reply({
        content: "❌ Erreur lors de la lecture du fichier des avertissements.",
        ephemeral: true,
      });
    }

    // --- 2. RÉCUPÉRATION DES WARNS DU MEMBRE ---
    const userWarns = allWarns[guild.id]?.[user.id];

    if (!userWarns || userWarns.length === 0) {
      return interaction.reply({
        content: `**${user.tag}** n'a aucun avertissement sur ce serveur.`,
        ephemeral: true,
      });
    }

    // Trier du plus récent au plus ancien
    userWarns.sort((a, b) => b.date - a.date);

    // --- 3. CONSTRUCTION DE L'EMBED ---
    const Embed = new Discord.EmbedBuilder()
      .setColor(bot.color || "#ff0000")
      .setTitle(`📜 Liste des warns : ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .setDescription(
        `Ce membre possède actuellement \`${userWarns.length}\` avertissement(s).`,
      )
      .setTimestamp()
      .setFooter({ text: "Système de Modération" });

    // Limiter l'affichage aux 25 derniers
    const displayWarns = userWarns.slice(0, 25);

    displayWarns.forEach((warn, index) => {
      Embed.addFields({
        name: `Warn n°${userWarns.length - index}`,
        value: `> **Modérateur** : <@${warn.authorId}> (${warn.authorTag})\n> **ID** : \`${warn.id}\`\n> **Raison** : \`${warn.reason}\`\n> **Date** : <t:${Math.floor(warn.date / 1000)}:F>`,
      });
    });

    await interaction.reply({ embeds: [Embed] });
  },
};
