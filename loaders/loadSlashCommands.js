const Discord = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord.js');

module.exports = async (bot) => {
	let commands = [];

	bot.commands.forEach(async (command) => {
		let slashCommand = new Discord.SlashCommandBuilder()
			.setName(command.name)
			.setDescription(command.description)
			.setDMPermission(command.dm)
			.setDefaultMemberPermissions(
				command.permission === 'Aucune' ? null : command.permission
			);

		// Vérifier s'il y a des options pour la commande
		if (command.options?.length >= 1) {
			const optionTypeMap = {
				[Discord.ApplicationCommandOptionType.String]: 'String',
				[Discord.ApplicationCommandOptionType.Integer]: 'Integer',
				[Discord.ApplicationCommandOptionType.Boolean]: 'Boolean',
				[Discord.ApplicationCommandOptionType.User]: 'User',
				[Discord.ApplicationCommandOptionType.Channel]: 'Channel',
				[Discord.ApplicationCommandOptionType.Role]: 'Role',
				[Discord.ApplicationCommandOptionType.Mentionable]: 'Mentionable',
			};

			for (let i = 0; i < command.options.length; i++) {
				let optionType = optionTypeMap[command.options[i].type];

				if (optionType) {
					slashCommand[`add${optionType}Option`]((option) => {
						let opt = option
							.setName(command.options[i].name)
							.setDescription(command.options[i].description)
							.setRequired(command.options[i].required);

						// Appliquer `.setAutocomplete(true)` uniquement si c'est une String
						if (
							command.options[i].type ===
								Discord.ApplicationCommandOptionType.String &&
							command.options[i].autocomplete
						) {
							opt.setAutocomplete(true);
						}

						return opt;
					});
				}
			}
		}

		commands.push(slashCommand);
	});

	const rest = new REST({ version: '10' }).setToken(bot.token);

	try {
		await rest.put(Routes.applicationCommands(bot.user.id), { body: commands });
		console.log('✅ Les slash commandes ont été enregistrées avec succès !');
	} catch (error) {
		console.error('❌ Erreur lors de l’enregistrement des commandes :', error);
	}
};
