const fs = require("fs");
const Discord = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord.js");
const config = require("../config"); // On garde l'import pour le TOKEN uniquement

module.exports = async (bot) => {
  // 1. Charger les IDs depuis le fichier JSON de ticket
  const pathTickets = "./configTickets.json";
  let ticketConfig = {};

  if (fs.existsSync(pathTickets)) {
    try {
      const data = fs.readFileSync(pathTickets, "utf8");
      if (data.trim().length > 0) ticketConfig = JSON.parse(data);
    } catch (e) {
      console.error("❌ Erreur de lecture du JSON dans le loader :", e);
    }
  }

  // Récupération des IDs (depuis le JSON ou fallback vide)
  const CLIENT_ID = ticketConfig.clientId;
  const GUILD_ID = ticketConfig.guildId;

  // 2. Chargement des fichiers de commandes en mémoire
  const commandFiles = fs
    .readdirSync("./Commands")
    .filter((f) => f.endsWith(".js"));
  let commandsToDeploy = [];

  for (const file of commandFiles) {
    let command = require(`../Commands/${file}`);
    bot.commands.set(command.name, command);

    let slashCommand = new Discord.SlashCommandBuilder()
      .setName(command.name)
      .setDescription(command.description)
      .setDMPermission(command.dm)
      .setDefaultMemberPermissions(
        command.permission === "Aucune" ? null : command.permission,
      );

    if (command.options && command.options.length > 0) {
      for (const opt of command.options) {
        if (opt.type === 1) {
          slashCommand.addSubcommand((sub) => {
            sub.setName(opt.name).setDescription(opt.description);
            if (opt.options) addOptionsToBuilder(sub, opt.options);
            return sub;
          });
        } else {
          addOptionsToBuilder(slashCommand, [opt]);
        }
      }
    }
    commandsToDeploy.push(slashCommand.toJSON());
  }

  // 3. Envoi à Discord via REST (Seulement si les IDs existent)
  if (!CLIENT_ID || !GUILD_ID) {
    console.warn(
      "⚠️ Impossible d'enregistrer les commandes : clientId ou guildId absent de configTickets.json.",
    );
    console.warn(
      "👉 Connectez le bot et utilisez /ticketconfig setup pour les configurer en premier.",
    );
    return;
  }

  const rest = new REST({ version: "10" }).setToken(config.token);

  try {
    console.log(`🚀 Enregistrement des commandes pour l'ID : ${CLIENT_ID}`);
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commandsToDeploy,
    });
    console.log("✅ Les slash commandes sont à jour sur le serveur !");
  } catch (error) {
    console.error("❌ Erreur REST :", error);
  }
};

function addOptionsToBuilder(builder, options) {
  const optionTypeMap = {
    3: "String",
    4: "Integer",
    5: "Boolean",
    6: "User",
    7: "Channel",
    8: "Role",
    9: "Mentionable",
  };

  for (const o of options) {
    const typeName = optionTypeMap[o.type];
    if (typeName) {
      builder[`add${typeName}Option`]((option) => {
        option
          .setName(o.name)
          .setDescription(o.description)
          .setRequired(o.required || false);

        // --- AJOUT ICI : Gestion des Choices ---
        if (o.choices && o.choices.length > 0) {
          option.addChoices(...o.choices);
        }

        if (o.type === 3 && o.autocomplete) {
          option.setAutocomplete(true);
        }

        return option;
      });
    }
  }
}
