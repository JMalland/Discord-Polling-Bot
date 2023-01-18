
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

function grabQuotes(content) {
	results = []
	string = ""
	for (var i=0; i<content.length; i++) {
		if (i != 0 && content[i] == '"' && content[i-1] == '/') { // Character is an escaped quote
			string += '"' // Add the quote to the string
		}
		else if (i != 0 && content[i] == '"' && content[i-1] != '/') { // End of quote
			results.push(string) // Update the string to the array
			content = content.substring(i + 1) // Skip past everything before the quote
			if (content.includes(" \"")) { // Content contains more quotes
				i = content.indexOf(" \"") // Update 'i' to be the proper index of the next quote
			}
		}
		else { // Character is anything except a quote.
			string += content.charAt(i) // Add the normal character to the string
		}
	}
	return(results)
}

function grabEmotes(content) {
	results = content.match(/<a?:.+?:\d{18}>|\p{Extended_Pictographic}/gu) // Pre ES6 way of parsing emoji's from messages
	for (e of results) {
		if (!content.includes(e + " \"")) { // Emoji is not represented as a survey option
			results.pop(e)
		}
	}
	return(results)
}

function parseCommand(message) {
	if (message.content.charAt(0) != '"') { // Structure of the command is invalid
		// Invalid Formatting Error !!!
		return
	}

	quotes = grabQuotes(message.content) // Store all the quotes in the survey
	emotes = grabEmotes(message.content) // Store all the emojis used in the survey
	reply = "" // Stores the reply message of the survey command
	
	// Same First and Last Index Error !!!
	for (var i=0; i<quotes.length - emotes.length; i++) { // Add extra spacing
		emotes.unshift("") // Add an empty string, just to line up the quotes and emojis
	}

	console.log(quotes)
	console.log(emotes)

	for (var i=0; i<quotes.length; i++) {
		if (emotes[i] == "") { // The stored emoji is just null
			reply += quotes[i] // Add the next quote to the reply
		}
		else {
			reply += "\n *\t" + emotes[i] + " " + quotes[i] // Add the emoji option to the reply
		}
	}

	message.channel.send({ // Send the formatted reply
		files: [...message.attachments.values()],
		content: reply + "\n *\t"
	}).then((message) => { // Add the options to the survey
		for (e of emotes) { // Loop through the options
			if (e != "") { // The emoji is not null
				message.react(e) // Add the emoji reaction
			}
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
	if (message.content.charAt(0) == '!') {
		parseCommand(message)
	}
})

// Login to Discord with your client's token
client.login(token);