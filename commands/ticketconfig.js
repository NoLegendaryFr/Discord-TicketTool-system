const {
  PermissionFlagsBits,
  ApplicationCommandOptionType,
  ChannelType,
} = require("discord.js");
const db = require("../utils/database");

module.exports = {
  name: "ticketconfig",
  description: "Configuration globale du système de tickets et modération",
  permission: PermissionFlagsBits.Administrator,
  dm: false,
  category: "Configuration",
  options: [
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "setup",
      description: "Configure les IDs de base du bot",
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "client_id",
          description: "L'ID du bot",
          required: true,
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "guild_id",
          description: "L'ID du serveur",
          required: true,
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "logs",
      description: "Configure le salon des logs",
      options: [
        {
          type: ApplicationCommandOptionType.Channel,
          name: "salon",
          description: "Le salon où envoyer les logs",
          required: true,
          channel_types: [ChannelType.GuildText],
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "warn_config",
      description: "Configure le salon autorisé pour les warns",
      options: [
        {
          type: ApplicationCommandOptionType.Channel,
          name: "channel",
          description: "Le salon où les commandes warn sont autorisées",
          required: true,
          channel_types: [ChannelType.GuildText],
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "staff_config",
      description: "Gérer les rôles et leur niveau d'importance",
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "action",
          description: "Ajouter ou retirer ?",
          required: true,
          choices: [
            { name: "Ajouter/Modifier", value: "ajouter" },
            { name: "Retirer", value: "retirer" },
          ],
        },
        {
          type: ApplicationCommandOptionType.Role,
          name: "role",
          description: "Le rôle à configurer",
          required: true,
        },
        {
          type: ApplicationCommandOptionType.Integer,
          name: "importance",
          description: "Niveau hiérarchique",
          required: false,
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "messages",
      description: "Configure les textes des tickets",
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "dm_texte",
          description: "Le message envoyé en MP",
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "ticket_description",
          description: "La description dans le ticket",
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "categorie",
      description: "Ajouter ou modifier une catégorie de ticket",
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "id_unique",
          description: "Ex: moderation",
          required: true,
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "category_id",
          description: "ID catégorie Discord",
          required: true,
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "label",
          description: "Nom dans le menu",
          required: true,
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "emoji",
          description: "Emoji",
          required: true,
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "del_categorie",
      description: "Supprimer une catégorie de ticket",
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "id_unique",
          description: "Sélectionnez la catégorie à supprimer",
          required: true,
          autocomplete: true,
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "main_pannel",
      description: "Configure l'embed et le bouton d'ouverture",
      options: [
        {
          type: ApplicationCommandOptionType.Channel,
          name: "salon",
          description: "Le salon où l'interface sera envoyée",
          required: false,
          channel_types: [0], // Uniquement les salons textuels
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "titre",
          description: "Le titre de l'embed",
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "description",
          description: "La description de l'embed",
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "couleur",
          description: "Couleur de la bordure en Hexadecimal (ex: #ffd700)",
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "bouton_texte",
          description: "Texte sur le bouton",
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "bouton_emoji",
          description: "Emoji sur le bouton",
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "bouton_couleur",
          description: "Couleur du bouton",
          choices: [
            { name: "Bleu (Primary)", value: "1" },
            { name: "Gris (Secondary)", value: "2" },
            { name: "Vert (Success)", value: "3" },
            { name: "Rouge (Danger)", value: "4" },
          ],
        },
      ],
    },
  ],

  async autocomplete(bot, interaction) {
    const focusedOption = interaction.options.getFocused(true);

    // Si l'utilisateur est en train de remplir l'option "id_unique"
    if (focusedOption.name === "id_unique") {
      const config = db.readData("configTickets.json");

      // Récupère les clés (IDs) de l'objet categories, ou un tableau vide si rien n'existe
      const categories = config.categories
        ? Object.keys(config.categories)
        : [];

      // Filtre les résultats selon ce que l'utilisateur commence à taper
      const filtered = categories.filter((choice) =>
        choice.toLowerCase().includes(focusedOption.value.toLowerCase()),
      );

      // Répond à Discord avec les suggestions (max 25)
      await interaction.respond(
        filtered
          .slice(0, 25)
          .map((choice) => ({ name: choice, value: choice })),
      );
    }
  },

  async run(bot, interaction) {
    // Initialisation avec des valeurs par défaut si le fichier est vide
    let defaultOptions = {
      clientId: "",
      guildId: "",
      staffRoles: [],
      dmMessage: "",
      embedDescription: "",
      categories: {},
      warnChannel: "",
      logsChannel: "",
      mainEmbedTitle: "🎫 Support - Ouverture de ticket",
      mainEmbedDesc:
        "Cliquez sur le bouton ci-dessous pour contacter le staff.",
      mainEmbedColor: "#0099ff",
      buttonLabel: "Créer un ticket",
      buttonEmoji: "🎟️",
      buttonStyle: 1,
    };

    let config = { ...defaultOptions, ...db.readData("configTickets.json") };

    if (
      !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
    ) {
      return interaction.reply({
        content: "❌ Accès refusé (Admin requis).",
        ephemeral: true,
      });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === "setup") {
      config.clientId = interaction.options.getString("client_id");
      config.guildId = interaction.options.getString("guild_id");
      db.saveData("configTickets.json", config);
      return interaction.reply({
        content: "✅ Configuration de base enregistrée.",
        ephemeral: true,
      });
    }

    if (sub === "logs") {
      config.logsChannel = interaction.options.getChannel("salon").id;
      db.saveData("configTickets.json", config);
      return interaction.reply({
        content: "✅ Salon logs configuré.",
        ephemeral: true,
      });
    }

    if (sub === "categorie") {
      const id = interaction.options.getString("id_unique");
      config.categories[id] = {
        categoryId: interaction.options.getString("category_id"),
        label: interaction.options.getString("label"),
        emoji: interaction.options.getString("emoji"),
      };
      db.saveData("configTickets.json", config);

      let counters = db.readData("ticketCounter.json");
      if (!counters[id]) {
        counters[id] = 1;
        db.saveData("ticketCounter.json", counters);
      }

      return interaction.reply({
        content: `✅ Catégorie **${id}** ajoutée et compteur initialisé.`,
        ephemeral: true,
      });
    }

    // --- Logique de suppression ---
    if (sub === "del_categorie") {
      const id = interaction.options.getString("id_unique");

      if (!config.categories || !config.categories[id]) {
        return interaction.reply({
          content: `❌ La catégorie **${id}** n'existe pas.`,
          ephemeral: true,
        });
      }

      // Suppression de la catégorie dans la config
      delete config.categories[id];
      db.saveData("configTickets.json", config); //

      // Nettoyage automatique du compteur de tickets pour cette catégorie
      let counters = db.readData("ticketCounter.json"); //
      if (counters[id]) {
        delete counters[id];
        db.saveData("ticketCounter.json", counters);
      }

      return interaction.reply({
        content: `✅ Catégorie **${id}** et son compteur supprimés avec succès.`,
        ephemeral: true,
      });
    }
    
    if (sub === "warn_config") {
      config.warnChannel = interaction.options.getChannel("channel").id;
      db.saveData("configTickets.json", config);
      return interaction.reply({
        content: "✅ Salon warn configuré.",
        ephemeral: true,
      });
    }

    if (sub === "staff_config") {
      const action = interaction.options.getString("action");
      const role = interaction.options.getRole("role");

      // S'assurer que config.staffRoles est bien un tableau
      if (!Array.isArray(config.staffRoles)) config.staffRoles = [];

      if (action === "ajouter") {
        const importance = interaction.options.getInteger("importance") || 1;
        const index = config.staffRoles.findIndex((r) => r.id === role.id);
        if (index !== -1) config.staffRoles[index].level = importance;
        else config.staffRoles.push({ id: role.id, level: importance });
      } else {
        config.staffRoles = config.staffRoles.filter((r) => r.id !== role.id);
      }
      db.saveData("configTickets.json", config);
      return interaction.reply({
        content: "✅ Rôles staff mis à jour.",
        ephemeral: true,
      });
    }

    if (sub === "messages") {
      config.dmMessage =
        interaction.options.getString("dm_texte") || config.dmMessage;
      config.embedDescription =
        interaction.options.getString("ticket_description") ||
        config.embedDescription;
      db.saveData("configTickets.json", config);
      return interaction.reply({
        content: "✅ Messages mis à jour.",
        ephemeral: true,
      });
    }

    if (sub === "main_pannel") {
      const salon = interaction.options.getChannel("salon");
      const titre = interaction.options.getString("titre");
      const desc = interaction.options.getString("description");
      const bTexte = interaction.options.getString("bouton_texte");
      const bEmoji = interaction.options.getString("bouton_emoji");
      const bCouleur = interaction.options.getString("bouton_couleur");
      const couleurEmbed = interaction.options.getString("couleur");

      if (salon) config.mainChannel = salon.id;
      if (titre) config.mainEmbedTitle = titre;
      if (desc) config.mainEmbedDesc = desc;
      if (bTexte) config.buttonLabel = bTexte;
      if (bEmoji) config.buttonEmoji = bEmoji;
      if (bCouleur) config.buttonStyle = parseInt(bCouleur);

      if (couleurEmbed && /^#[0-9A-F]{6}$/i.test(couleurEmbed)) {
        config.mainEmbedColor = couleurEmbed;
      }

      // Utilisation de la database au lieu de fs.writeFileSync
      db.saveData("configTickets.json", config);

      return interaction.reply({
        content: `✅ Configuration du pannel mise à jour !${
          salon ? `\n📍 Salon défini sur : <#${salon.id}>` : ""
        }`,
        ephemeral: true,
      });
    }
  },
};
