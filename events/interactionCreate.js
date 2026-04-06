const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ChannelType,
  PermissionFlagsBits,
  InteractionType,
} = require("discord.js");
const fs = require("fs");
const pathConfig = "./configTickets.json";
const pathCounter = "./ticketCounter.json";

module.exports = async (bot, interaction) => {
  // --- 1. CHARGEMENT CONFIG ET COMPTEUR ---
  let config = { staffRoles: [], categories: {}, guildId: "" };
  if (fs.existsSync(pathConfig)) {
    try {
      config = JSON.parse(fs.readFileSync(pathConfig, "utf8"));
    } catch (e) {
      console.error("Erreur config:", e);
    }
  }

  let ticketCounter = {};
  if (fs.existsSync(pathCounter)) {
    try {
      ticketCounter = JSON.parse(fs.readFileSync(pathCounter, "utf8"));
    } catch (e) {
      console.error("Erreur counter:", e);
    }
  }

  // --- 2. GESTION DE L'AUTOCOMPLÉTION ---
  if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
    const command = bot.commands.get(interaction.commandName);
    if (command && typeof command.autocomplete === "function") {
      try {
        return await command.autocomplete(bot, interaction);
      } catch (error) {
        console.error("Erreur Autocomplete:", error);
      }
    }
    return;
  }

  // --- 3. COMMANDES SLASH ---
  if (interaction.isChatInputCommand()) {
    const command = bot.commands.get(interaction.commandName);
    if (!command) return;
    return command.run(bot, interaction, interaction.options, bot.db);
  }

  // --- 4. BOUTON "CRÉER UN TICKET" ---
  if (interaction.isButton() && interaction.customId === "create_ticket") {
    try {
      await interaction.user.send(
        config.dmMessage || "👋 Merci de détailler votre demande ici.",
      );
      await interaction.reply({
        content: "📩 Vérifiez vos messages privés !",
        flags: [64],
      });

      const filter = (m) => m.author.id === interaction.user.id;
      const collector = interaction.user.dmChannel.createMessageCollector({
        filter,
        max: 1,
        time: 300000,
      });

      collector.on("collect", async (m) => {
        if (!config.categories || Object.keys(config.categories).length === 0) {
          return m.reply("❌ Aucune catégorie configurée.");
        }

        const selectMenu = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("select_ticket_category")
            .setPlaceholder("Choisissez une catégorie")
            .addOptions(
              Object.keys(config.categories).map((key) => ({
                label: config.categories[key].label || key,
                value: key,
                emoji: config.categories[key].emoji || "🎫",
              })),
            ),
        );

        await m.reply({
          content: "✅ Sélectionnez la catégorie de votre ticket :",
          components: [selectMenu],
        });
        bot.tempTicketData = bot.tempTicketData || new Map();
        bot.tempTicketData.set(interaction.user.id, m.content);
      });
    } catch (e) {
      return interaction.reply({
        content: "❌ Vos DM sont fermés !",
        ephemeral: true,
      });
    }
  }

  // --- 5. GESTION DU MENU DÉROULANT (CRÉATION DU SALON) ---
  if (
    interaction.isStringSelectMenu() &&
    interaction.customId === "select_ticket_category"
  ) {
    const selectedKey = interaction.values[0];
    const cat = config.categories[selectedKey];

    if (!cat)
      return interaction.reply({
        content: "Catégorie introuvable.",
        ephemeral: true,
      });

    const userReason =
      bot.tempTicketData?.get(interaction.user.id) || "Aucune description.";
    const guild = await bot.guilds.fetch(config.guildId);

    // CHANGEMENT ICI : On utilise selectedKey au lieu de cat.type pour le compteur
    const ticketNumber = String(ticketCounter[selectedKey] || 1).padStart(
      3,
      "0",
    );
    const channelName = `${selectedKey}-${ticketNumber}`; // Ex: moderation-001

    // Permissions Staff
    const staffPerms = config.staffRoles.map((r) => ({
      id: typeof r === "string" ? r : r.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    }));

    try {
      const channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: cat.categoryId,
        permissionOverwrites: [
          { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          {
            id: interaction.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
            ],
          },
          ...staffPerms,
        ],
      });

      // UPDATE COMPTEUR PAR CATÉGORIE
      ticketCounter[selectedKey] = (ticketCounter[selectedKey] || 1) + 1;
      fs.writeFileSync(pathCounter, JSON.stringify(ticketCounter, null, 2));

      // Bouton Fermer
      const closeRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("close_ticket")
          .setLabel("Fermer le ticket")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("🔒"),
      );

      const embed = new EmbedBuilder()
        .setTitle(`${cat.emoji} ${cat.label}`)
        .setColor(bot.color || "#0099ff")
        .setDescription(
          `${config.embedDescription}\n\n**Raison :** ${userReason}`,
        )
        .setFooter({
          text: `${bot.user.username} - Système de tickets créé par No_Legendary_Fr`,
        });

      await channel.send({
        content: `<@${interaction.user.id}> `,
        embeds: [embed],
        components: [closeRow],
      });

      await interaction.update({
        content: `✅ Ticket créé : ${channel}`,
        components: [],
      });
      bot.tempTicketData.delete(interaction.user.id);
    } catch (err) {
      console.error(err);
      interaction.reply({
        content: "Erreur lors de la création.",
        ephemeral: true,
      });
    }
  }

  // --- 6. GESTION DU BOUTON FERMER ---
  if (interaction.isButton() && interaction.customId === "close_ticket") {
    const userRoles = interaction.member.roles.cache;
    const staffData = config.staffRoles
      .filter((r) => userRoles.has(r.id))
      .sort((a, b) => (b.level || 0) - (a.level || 0))[0];

    const isAdmin = interaction.member.permissions.has(
      PermissionFlagsBits.Administrator,
    );

    // Vérification de permission simplifiée
    if (!isAdmin && !staffData) {
      return interaction.reply({
        content: "❌ Seul le staff peut fermer ce ticket.",
        ephemeral: true,
      });
    }

    await interaction.reply("🔒 Fermeture du ticket demandée...");
    setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
  }
};
