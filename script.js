
// Require the necessary discord.js classes
const { Client, GatewayIntentBits, PermissionsBitField, quote } = require('discord.js');
const { token } = require('./config.json');

// Create a new client instance
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.MessageContent,
	]
});

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Ready!');
	return;
});

function mentionAuthor(message) {
	return("<@"+message.author.id+">")
}

function parseCommand(message) {
	const emotes = (str) => str.match(/<a?:.+?:\d{18}>|\p{Extended_Pictographic}/gu); // Pre ES6 way of parsing emoji's from messages
	msg = message.content.substring(message.content.indexOf(" ") + 1) // Skip past the initial command
	header = "" // Header at the beginning of the reply survey
	while (msg.charAt(0) != '"') { // Mentions a specific Role, User, Link, Etc
		header += msg.substring(0, msg.indexOf(" ")) + ", " // Create the @Mention tag
		msg = msg.substring(msg.indexOf(" ") + 1) // Skip everything before the current @Mention
	}
	if (msg.charAt(0) != '"') { // Structure of the command is invalid
		// Invalid Formatting Error !!!
		return
	}
	// Same First and Last Index Error !!!
	quotes = msg.substring(msg.indexOf("\"") + 1, msg.lastIndexOf("\"")) // Make the quote hold everything between the first and last quotations
	msg = msg.substring(msg.lastIndexOf("\"") + 1) // Skip everything except the emojis and opinions
	emojis = emotes(msg) // Store the emojis
	opinions = [] // Store the opinions
	for (var i=0; i<emojis.length; i++) {
		msg = msg.substring(msg.indexOf(emojis[i]) + 2) // Skip everything before the current emoji
		opinions.push(msg.substring(0, i < emojis.length - 1 ? msg.indexOf(emojis[i+1]) : msg.length)) // Add the text between emojis to the opinions
	}
	reply = header + "\"" + quotes + "\"\n * " // Store the header of the reply
	for (var i=0; i<emojis.length; i++) { // Loop through each option
		reply += "\n * " + emojis[i] + "  " + opinions[i] // Add the option and corresponding emoji
	}
	message.channel.send({ // Send the formatted reply
		files: [...message.attachments.values()],
		content: reply + "\n * "
	}).then((message) => { // Add the options to the survey
		for (e of emojis) { // Loop through the options
			message.react(e) // Add the emoji reaction
		}
	})
	.catch(() => {
		// None ? 
	})
}

client.on("messageCreate", async (message) => {
	if (message.author.bot) {
		return;
	}
	console.log(message)
	if (message.content.charAt(0) == '!') {
		parseCommand(message)
	}
	//if (message.content.substring(0, 7) === '!survey') {
	//	message.channel.send("Hi! What's your name?")
	//}
})

// Login to Discord with your client's token
client.login(token);