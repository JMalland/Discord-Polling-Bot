
// Require the necessary discord.js classes
const { Client, GatewayIntentBits, PermissionsBitField, quote, time } = require('discord.js');
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

function grabQuotes(content) {
	results = []
	string = ""

	if (!content.includes(" \"")) { // No quotes found in survey request
		console.log("Quote Content Error!")
		return(results)
	}
	content = content.substring(content.indexOf(" \"")).trim() // Skip to the quote
	
	for (var i=0; i<content.length; i++) {
		if (i != 0 && content[i] == '"' && content[i-1] == '/') { // Character is an escaped quote
			string += '"' // Add the quote to the string
		}
		else if (i != 0 && content[i] == '"' && content[i-1] != '/') { // End of quote
			results.push(string) // Update the string to the array
			string = "" // Clear the string
			content = content.substring(i) // Skip past everything before the quote
			if (content.includes(" \"")) { // Content contains more quotes
				content = content.substring(content.indexOf(" \"")).trim() // Skip to the next quote
				i = 0 // Reset 'i' to start over for the new quote
			}
		}
		else if (i != 0 || content[i] != '"') { // Character is anything except a quote, if the index is 0
			string += content.charAt(i) // Add the normal character to the string
		}
	}
	return(results)
}

function grabEmotes(content) {
	// Will need to check individually to see if the emoji index is chronologically found within a quote.
	results = content.match(/<a?:.+?:\d{18}>|\p{Extended_Pictographic}/gu) // Pre ES6 way of parsing emoji's from messages
	if (results == null) { // No emojis found
		return([]) // Return an empty list
	}
	for (e of results) { // Loop through each emoji found
		if (!content.includes(e + " \"")) { // Emoji is not represented as a survey option
			results.splice(results.indexOf(e), 1) // Remove the emoji from the list
		}
	}
	return(results)
}

function conductSurvey(message) {
	console.log("Conducting Survey")
	if (message.content.indexOf("!survey \"") != 0) { // Structure of the command is invalid
		// Invalid Formatting Error !!!
		console.log("Formatting Error!")
		return
	}

	quotes = grabQuotes(message.content) // Store all the quotes in the survey
	emotes = grabEmotes(message.content) // Store all the emojis used in the survey
	
	times = message.content.substring(message.content.indexOf(quotes[quotes.length - 1]) + quotes[quotes.length - 1].length + 1).trim() // Cut out the time requirement, if it exists
	
	if (times.includes(":")) { // The survey request has a time constraint
		times = times.split(":")
	}
	else { // The survey request lasts for the default amount of time
		times = [0, 0, 0, 0]
	}

	HOURS = 24
	MINUTES = 60
	SECONDS = 60

	d = parseInt(times[0]) // Number of days
	h = parseInt(times[1]) // Number of hours
	m = parseInt(times[2]) // Number of minutes
	s = parseInt(times[3]) // Number of seconds

	timestamp = "<t:" + (parseInt(Date.now()/1000) + (d * HOURS * MINUTES * SECONDS) + (h * MINUTES * SECONDS) + (m * SECONDS) + s) + ":R>" + "<t:" + (parseInt(Date.now()/1000) + (h * MINUTES * SECONDS) + (m * SECONDS) + s) + ":R>" + "<t:" + (parseInt(Date.now()/1000) + (m * SECONDS) + s) + ":R>" + "<t:" + (parseInt(Date.now()/1000) + s) + ":R>"
	
	// Same First and Last Index Error !!!
	for (var i=0; i<quotes.length - emotes.length; i++) { // Add extra spacing
		emotes.unshift("") // Add an empty string, just to line up the quotes and emojis
	}

	console.log(quotes)
	console.log(emotes)
	console.log(d + " Days. " + h + " Hours. " + m + " Mins. " + s + " Secs.")

	header = "" // Stores the heading of the formatted reply
	body = "" // Stores the body of formatted emojis and options

	for (var i=0; i<quotes.length; i++) {
		if (emotes[i] == "") { // The stored emoji is just null
			header += quotes[i] // Add the next quote to the reply
		}
		else {
			body += "\n *\t" + emotes[i] + " " + quotes[i] // Add the emoji option to the reply
		}
	}

	message.channel.send({ // Send the formatted reply
		files: [...message.attachments.values()],
		content: header + "\n *\t" + body + "\n * Ends In: --:--:--" + timestamp
	}).then((message) => { // Add the options to the survey
		for (e of emotes) { // Loop through the options
			if (e != "") { // The emoji is not null
				message.react(e) // Add the emoji reaction
			}
		}
		s = setTimeout(() => {
			// Reset Seconds Timer To 60s
		}, s * 1000)
		m = setTimeout(() => {
			// Reset Minutes Timer To 60m
		}, (m * SECONDS + s) * 1000)
		h = setTimeout(() => {
			// Reset Hours Timer To 24h
		}, (h * MINUTES * SECONDS + m * SECONDS + s) * 1000)
		//d = setTimeout(() => {
		//	// Reset Days Timer (Not Needed)
		//}, (d * HOURS * MINUTES * SECONDS + h * MINUTES * SECONDS + m * SECONDS + s) * 1000)
	})
	.catch(() => {
		// None ? 
	})
}

client.on("messageCreate", async (message) => {
	if (message.author.bot) {
		return;
	}
	console.log(message.content)
	if (message.content.charAt(0) == '!') {
		conductSurvey(message)
	}
})

// Login to Discord with your client's token
client.login(token);