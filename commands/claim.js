const {
  PermissionFlagsBits,
  ApplicationCommandOptionType,
  EmbedBuilder,
} = require("discord.js");
const fs = require("fs");
const pathConfig = "./configTickets.json";
const logger = require("../utils/logger");

module.exports = {
  name: "claim",
  description: "Prendre en charge un ticket (Réservé au Staff)",
  permission: PermissionFlagsBits.SendMessages,
  dm: false,
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "nom",
      description: "Nouveau nom du salon (Ex: urgent-mod-01)",
      required: false,
    },
  ],

  async run(bot, interaction) {
    // 1. Charger la configuration
    let config = { staffRoles: [], categories: {} };
    if (fs.existsSync(pathConfig)) {
      try {
        config = JSON.parse(fs.readFileSync(pathConfig, "utf8"));
      } catch (e) {
        return interaction.reply({
          content: "❌ Erreur de lecture de la configuration.",
          ephemeral: true,
        });
      }
    }

    // 2. VÉRIFICATION DU STAFF (Rôles configurés ou Admin)
    const userRoles = interaction.member.roles.cache;
    const isStaff =
      config.staffRoles.some((r) => userRoles.has(r.id)) ||
      interaction.member.permissions.has(PermissionFlagsBits.Administrator);

    if (!isStaff) {
      return interaction.reply({
        content: "❌ Vous n'êtes pas autorisé à utiliser cette commande.",
        ephemeral: true,
      });
    }

    // 3. VÉRIFICATION DE LA CATÉGORIE
    const parentId = interaction.channel.parentId;
    const isTicketChannel = Object.values(config.categories).some(
      (cat) => cat.categoryId === parentId,
    );

    if (!isTicketChannel) {
      return interaction.reply({
        content: "❌ Cette commande est réservée aux salons de tickets.",
        ephemeral: true,
      });
    }

    // 4. RÉCUPÉRATION DU NOUVEAU NOM
    const newNameInput = interaction.options.getString("nom");
    const user = interaction.user;

    // 5. ENVOI DE L'EMBED DE CONFIRMATION
    const embed = new EmbedBuilder()
      .setTitle("📍 Ticket pris en charge")
      .setDescription(`Ce ticket est désormais géré par ${user}.`)
      .setColor("#2b2d31")
      .setTimestamp()
      .setFooter({
        text: `Pris en charge par ${user.tag}`,
        iconURL: user.displayAvatarURL(),
      });

    await interaction.reply({ embeds: [embed] });

    await logger(
      bot,
      interaction.guild,
      "Ticket Claimed",
      interaction.user, // Le modérateur
      interaction.user, // La cible (lui-même ici, car il prend le ticket)
      `Salon : ${interaction.channel.name}${newNameInput ? ` (Renommé en : ${newNameInput})` : ""}`,
    );

    // 6. LOGIQUE DE RENOMMAGE (Si un nom a été fourni)
    if (newNameInput) {
      try {
        const formattedName = newNameInput
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-z0-9-]/g, "");

        await interaction.channel.setName(formattedName);
      } catch (err) {
        console.error("Erreur renommage channel:", err);
        await interaction.followUp({
          content:
            "⚠️ Le ticket est claim, mais le nom n'a pas pu être modifié (limite de Discord).",
          ephemeral: true,
        });
      }
    }
  },
};
