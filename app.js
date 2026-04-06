/**
 * ---------------------------------------------------------
 * PROJECT : TicketTool System Bot
 * AUTHOR  : No_Legendary_Fr
 * LICENSE : CC BY-ND 4.0
 * DESCRIPTION : Ce code est la propriété de No_Legendary_Fr.
 * La mention de l'auteur doit rester intacte.
 * ---------------------------------------------------------
 */

const Discord = require("discord.js");
const intents = new Discord.IntentsBitField(53608447);
const bot = new Discord.Client({ intents });

const loadCommands = require("./loaders/loadCommands");
const loadEvents = require("./loaders/loadEvents");
const config = require("./config");

bot.commands = new Discord.Collection();

(async () => {
  // Chargement des commandes et des évènements
  await loadCommands(bot);
  await loadEvents(bot);

  // Dans app.js, avant bot.login
  process.on("unhandledRejection", (reason, promise) => {
    console.error(" [ANTI-CRASH] Rejet non géré :", reason);
  });

  process.on("uncaughtException", (err, origin) => {
    console.error(" [ANTI-CRASH] Exception non capturée :", err);
  });

  // Connexion du bot
  bot.login(config.token);
})();
