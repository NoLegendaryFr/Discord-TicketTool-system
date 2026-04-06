const Discord = require("discord.js");
const fs = require("fs");
const pathConfig = "./configTickets.json";

module.exports = {
  name: "help",
  description: "Donne les commandes du bot",
  permission: Discord.PermissionFlagsBits.SendMessages,
  dm: false, 
  category: "Information",
  options: [
    {
      type: Discord.ApplicationCommandOptionType.String,
      name: "commande",
      description: "La commande a afficher",
      required: false,
      autocomplete: true,
    },
  ],

  async autocomplete(bot, interaction) {
    const focusedValue = interaction.options.getFocused();
    const choices = bot.commands.map((cmd) => cmd.name);
    const filtered = choices.filter((choice) =>
      choice.toLowerCase().includes(focusedValue.toLowerCase()),
    );

    await interaction.respond(
      filtered.slice(0, 25).map((choice) => ({ name: choice, value: choice })),
    );
  },

  async run(bot, interaction) {
    // --- LOGIQUE DE SÉCURITÉ (ADMIN OU STAFF) ---
    let isStaff = false;
    const isAdmin = interaction.member.permissions.has(
      Discord.PermissionFlagsBits.Administrator,
    );

    if (fs.existsSync(pathConfig)) {
      try {
        const config = JSON.parse(fs.readFileSync(pathConfig, "utf8"));
        const staffRoleIds = config.staffRoles.map((r) =>
          typeof r === "string" ? r : r.id,
        );
        isStaff = interaction.member.roles.cache.some((role) =>
          staffRoleIds.includes(role.id),
        );
      } catch (e) {
        console.error("Erreur lecture config aide:", e);
      }
    }

    if (!isAdmin && !isStaff) {
      return interaction.reply({
        content: "❌ Vous n'avez pas la permission d'utiliser cette commande.",
        ephemeral: true,
      });
    }

    // --- REPRISE DE TA MISE EN PAGE ---
    const commandName = interaction.options.getString("commande");
    let command;

    if (commandName) {
      command = bot.commands.get(commandName);
      if (!command)
        return interaction.reply({
          content: "Pas de commande",
          ephemeral: true,
        });
    }

    if (!command) {
      let categories = [];
      bot.commands.forEach((cmd) => {
        if (!categories.includes(cmd.category)) categories.push(cmd.category);
      });

      let Embed = new Discord.EmbedBuilder()
        .setColor(bot.color || "#0099ff")
        .setTitle(`Commandes du bot`)
        .setThumbnail(bot.user.displayAvatarURL({ dynamic: true }))
        .setDescription(
          `Commandes disponible : \`${bot.commands.size}\`\nCatégories disponibles : \`${categories.length}\``,
        )
        .setTimestamp()
        .setFooter({ text: "Commandes du robot" });

      // On trie les catégories et on ajoute les champs
      categories.sort().forEach((cat) => {
        let commands = bot.commands.filter((cmd) => cmd.category === cat);
        Embed.addFields({
          name: `${cat}`,
          value: `${commands
            .map((cmd) => `\`${cmd.name}\` : ${cmd.description} `)
            .join("\n")}`,
        });
      });

      await interaction.reply({ embeds: [Embed] });
    } else {
      // Affichage détaillé de TA mise en page
      let Embed = new Discord.EmbedBuilder()
        .setColor(bot.color || "#0099ff")
        .setTitle(`Commandes ${command.name}`)
        .setThumbnail(bot.user.displayAvatarURL({ dynamic: true }))
        .setDescription(
          `Nom : \`${command.name}\`\nDescription : \`${
            command.description
          }\` \nPermission requise : \`${
            typeof command.permission !== "bigint"
              ? command.permission
              : new Discord.PermissionsBitField(command.permission)
                  .toArray()
                  .join(", ")
          }\` \nCommande en DM : \`${
            command.dm ? " Oui" : "Non"
          }\` \nCatégorie : \`${command.category}\``,
        )
        .setTimestamp()
        .setFooter({ text: "Commandes du robot" });

      await interaction.reply({ embeds: [Embed] });
    }
  },
};
