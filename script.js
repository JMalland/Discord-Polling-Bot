// Require the necessary discord.js classes
const { Survey, User } = require('./survey.js') // Import the User and Survey class
const { Client, GatewayIntentBits, PermissionsBitField, quote, time, ReactionUserManager, CommandInteractionOptionResolver } = require('discord.js');
const { token } = require('./config.json');

// Create a new client instance
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessageReactions,
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

function grabEmotes(content, quotes) {
	// Will need to check individually to see if the emoji index is chronologically found within a quote.
	results = content.match(/<a?:.+?:\d{18}>|\p{Extended_Pictographic}/gu) // Pre ES6 way of parsing emoji's from messages
	if (results == null) { // No emojis found
		return([]) // Return an empty list
	}
	for (e of results) { // Loop through each emoji found
		for (q of quotes) { // Check each quote to see if the emoji is within it
			emoji = content.indexOf(e) // Store the index of the emoji
			start = content.indexOf(q)// The start index of the quote
			end = start + q.length // The end index of the quote
			if (emoji < start || start == -1) { // The emoji is found prior to the quote
				break // Quit the loop
			}
			else if (emoji > start && emoji < end) { // The emoji is found within the quote
				results.splice(results.indexOf(e), 1) // Remove the emoji from the list
				content = content.substring(emoji + 1) // Skip past the current emoji
				break // Quit the loop
			}
		}
	}
	return(results)
}

// Message should be formatted as:
// 	   !survey (int) "(string)" [EMOJI] ... (int)
//	   !survey (int) "(string)" [EMOJI] ...
//     !survey "(string)" [EMOJI] ...
//     !survey "(string)" [EMOJI] ... (int)
function conductSurvey(message) {
	FORMAT = "F"
	console.log("Conducting Survey")

	quotes = grabQuotes(message.content) // Store all the quotes in the survey
	emotes = grabEmotes(message.content, quotes) // Store all the emojis used in the survey
	
	minutes = parseInt(message.content.substring(message.content.indexOf(" "), message.content.indexOf("\"")).trim()) // Cut out the time requirement, if it exists
	selection = parseInt(message.content.substring(message.content.lastIndexOf("\"") + 1).trim()) // Cut out the maximum selection, if it's specified
	minutes = isNaN(minutes) ? 30 : minutes // Default timer of the survey - 30 minutes
	selection = isNaN(selection) ? 1 : selection // Default number of options a user may select
	
	console.log(quotes)
	console.log(emotes)

	console.log("Selection: " + selection)

	query = "" // Stores the heading of the formatted reply
	for (var i=0; i<quotes.length - emotes.length; i++) { // Loop through each quote that doesn't pair with an emoji
		query += quotes[0] // Add the next quote to the reply
		quotes.splice(i, 1) // Remove the quote from the list, as it part of the question
	}

	var survey = new Survey(query, quotes, emotes, selection, minutes) // Create the new survey

	message.channel.send({ // Send the formatted reply
		files: [...message.attachments.values()],
		content: survey.getMessage()
	}).then((message) => { // Add the options to the survey
		survey.message = message // Attach the message to the survey
		survey.addOptions() // Add the reactions to the survey message
	})
	.catch(() => {
		// None ? 
	})
}

client.on("messageCreate", async (message) => {
	if (message.author.bot) {
		return
	}
	if (message.content.charAt(0) == '!') {
		conductSurvey(message)
	}
})

client.on("messageReactionAdd", async (reaction, user) => {
	if (user.bot) { // The user is a bot
		return
	}
	message = reaction.message // Store the message
	survey = Survey.findSurvey(message) // Attempt to find the survey, if it exists
	user = User.getUser(user, reaction.emoji.toString(), survey) // Create or get the user
	if (user.addSurveyReaction(reaction.emoji.toString(), survey)) { // The user was able to use the reaction
		console.log("Reaction Added")
		return // Quit the method
	}
	console.log("Reaction Ignored")
	reaction.users.remove(user.user) // Remove the reaction
})

client.on("messageReactionRemove", async (reaction, user) => {
	if (user.bot) { // The user is a bot
		return
	}
	message = reaction.message // Store the message
	survey = Survey.findSurvey(message) // Attempt to find the survey, if it exists
	user = User.getUser(user, reaction.emoji.toString(), survey) // Create or get the user
	user.removeSurveyReaction(reaction.emoji.toString(), survey) // Remove the user's survey reaction
	console.log("Reaction Removed")
})

// Login to Discord with your client's token
client.login(token);