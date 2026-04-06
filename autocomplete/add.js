// const Discord = require('discord.js');

// module.exports = async function autocomplete(interaction) {
// 	const focusedOption = interaction.options.getFocused(true);
// 	const guild = interaction.guild;
// 	if (!guild) return;

// 	try {
// 		// Autocomplétion des utilisateurs
// 		if (focusedOption.name === 'utilisateur') {
// 			const users = (await guild.members.fetch())
// 				.filter((member) => !member.user.bot)
// 				.map((member) => ({ name: member.user.tag, value: member.id }))
// 				.filter((user) =>
// 					user.name.toLowerCase().includes(focusedOption.value.toLowerCase())
// 				)
// 				.slice(0, 25);

// 			return interaction.respond(
// 				users.length > 0
// 					? users
// 					: [{ name: 'Aucun utilisateur trouvé', value: 'none' }]
// 			);
// 		}
// 	} catch (error) {
// 		console.error("❌ Erreur dans l'autocomplétion :", error);
// 		return interaction.respond([]);
// 	}
// };
