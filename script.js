// Require the necessary discord.js classes
const { Survey, User } = require('./survey.js') // Import the User and Survey class
const { Quiz } = require('./quiz.js') // Import the Quiz class
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
	while (content.includes("\"")) {
		content = content.substring(content.indexOf("\"") + 1) // Trim the content to just inside the first quotation mark
		results.push(content.substring(0, content.indexOf("\""))) // Add the Strings found within the quotes to the results
		content = content.substring(content.indexOf("\"") + 1) // Trim the content to the end of the second quotation mark
	}
	return(results)
}

function grabEmotes(content, quotes) {
	// Will need to check individually to see if the emoji index is chronologically found within a quote.
	var parse = ""
	var temp = content // Store a copy of the content
	temp = temp.substring(temp.indexOf("\"") + 1)
	while (temp.includes("\"")) {
		temp = temp.substring(temp.indexOf("\"") + 1) // Trim the content to just inside the first quotation mark
		parse += temp.substring(0, temp.indexOf("\"")) // Add the in-between quotes space to the String to be parsed for emojis
		temp = temp.substring(temp.indexOf("\"") + 1) // Trim the content to the end of the second quotation mark
	}
	// \/ New Emoji Parser, Should Work better \/
	temp = parse.match(/(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/).input // Kevin Scott way of emoji parsing --> https://stackoverflow.com/questions/37089427/javascript-find-emoji-in-string-and-parse
	var results = [] // Empty array to hold all the emojis found before quotes
	for (var i of temp.trim().split(/\s+/)) { // Loop through all extra emojis found
		results.push(i) // Add the split emoji to the temp array
	}
	return(results) // Return the emojis found outside of " quotes in the command
}

function createSurvey(message) {
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

	return(new Survey("*  **__Survey:__**  ", quotes, emotes, "*  **__Survey Results:__**  ", selection, minutes)) // Create the new survey
}

client.on("messageCreate", async (message) => {
	if (message.author.bot) {
		return
	}
	var user = User.getUser(message.author) // Create or get the user
	var command = message.content.split(" ")[0] // Store the command executed
	/* Survey Command:
	*  	   !survey (int) "(string)" [EMOJI] ... (int)
	* 	   !survey (int) "(string)" [EMOJI] ...
	*      !survey "(string)" [EMOJI] ...
	*      !survey "(string)" [EMOJI] ... (int)
	*/
	/*  Quiz Command:
	*	   !CreateQuiz "(string)"	// Just the name of the quiz
	*	   !AddToQuiz ... 			// Same rules as the '!survey' command. The correct answer must be the first one listed 
	*/
	if (command == "!survey") {
		var survey = createSurvey(message) // Store the survey
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
	else if (command == "!CreateQuiz") { // Starts the quiz building process for the user
		user.makingQuiz = true // Sets the quiz status of the user
		user.surveyQuiz = new Quiz()
	}
	else if (command == "!AddToQuiz") { // Adds the survey question to the quiz
		var survey = createSurvey(message) // Store the quiz question as a survey
		user.surveyQuiz.addQuestion(survey) // Add the survey to the quiz
	}
	else if (command == "!StartQuiz") { // Runs the quiz as a compilation of surveys
		
	}
})

client.on("messageReactionAdd", async (reaction, user) => {
	if (user.bot) { // The user is a bot
		return
	}
	message = reaction.message // Store the message
	survey = Survey.findSurvey(message) // Attempt to find the survey, if it exists
	user = User.getUser(user) // Create or get the user
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
	user = User.getUser(user) // Create or get the user
	user.removeSurveyReaction(reaction.emoji.toString(), survey) // Remove the user's survey reaction
	console.log("Reaction Removed")
})

// Login to Discord with your client's token
client.login(token);