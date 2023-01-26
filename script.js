// Require the necessary discord.js classes
const { Survey } = require('./survey.js') // Import the Survey class
const { User } = require('./user.js') // Import the User class
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

function getQuote(str) {
	var match = str.match(/(?:"[^"]*"|^[^"]*$)/)
	return(match == null ? null : match[0].replace(/"/g, ""))
}

function grabQuotes(content) {
	var results = [] // Stores the list of quotes from the content
	var temp = getQuote(content) // Store the immediate quote
	while (temp != null && temp != "" && content.charAt(content.indexOf(temp) - 1) == '"') { // Keep going until there are no quotes to add
		results.push(temp.trim()) // Add the next quote to the list
		content = content.substring(content.indexOf(results[results.length - 1]) + results[results.length - 1].length + 1) // Trim the content to just beyond the end of the quote
		temp = getQuote(content) // Store the immediate quote
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

	quotes = grabQuotes(message) // Store all the quotes in the survey
	emotes = grabEmotes(message, quotes) // Store all the emojis used in the survey
	
	var numbers = message.substring(message.indexOf(" "), message.indexOf("\"")).trim().split(" ")
	answers = parseInt(numbers[0]) // Assume the valid answer count is being set instead of the duration (Gets corrected later)
	minutes = parseInt(numbers[1]) // Cut out the time requirement, if it exists
	selection = parseInt(message.substring(message.lastIndexOf("\"") + 1).trim()) // Cut out the maximum selection, if it's specified
	answers = answers <= 0 || isNaN(answers) ? 0 : answers // Default value of the correct answer count
	minutes = minutes <= 0 || isNaN(minutes) ? 30 : minutes // Default timer of the survey - 30 minutes
	selection = selection <= 0 || isNaN(selection) ? 1 : selection // Default number of options a user may select
	
	console.log(quotes)
	console.log(emotes)

	console.log("Selection: " + selection)

	return(new Survey("*  **__Survey:__**  ", quotes, emotes, "*  **__Survey Results:__**  ", selection, minutes, answers)) // Create the new survey
}

client.on("messageCreate", async (message) => {
	if (message.author.bot) {
		return
	}
	var content = message.content // Simplify message content
	var user = User.getUser(message.author) // Create or get the user
	var command = message.content.split(" ")[0] // Store the command executed
	/* Survey Command:
	*  	   !survey (int) "(string)" [EMOJI] ... (int)
	* 	   !survey (int) "(string)" [EMOJI] ...
	*      !survey "(string)" [EMOJI] ...
	*      !survey "(string)" [EMOJI] ... (int)
	*/
	/*  Quiz Command: // May want to make the "(string)" quiz name a command specific to the user?
	*	   !quiz "(string)"								// Just the name of the quiz
	*	   !quiz "(string)" start						// Just the name of the quiz
	*	   !quiz "(string)" add "(string)" !survey		// Specify the name of the question. Correct answers must be the first option listed.
	*	   !quiz "(string)" remove "(string)" 			// Remove the question from the quiz
	*	   !quiz "(string)" delete						// Delete the quiz
	*/
	if (command == "!survey") {
		var survey = createSurvey(content) // Store the survey
		survey.duration = survey.validAnswers > 0 ? survey.validAnswers : survey.duration // Update the duration of the survey if necessary
		survey.validAnswers = 0 // Set back to default since irrelevent anyways
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
	else if (command == "!quiz") { // Starts the quiz building process for the user
		var array = grabQuotes(content) // The individual components of the command
		user.quiz = user.getQuiz() // Get the quiz from the user
		if (content.includes("!quiz add")) { // Add a question to the quiz
			content = content.substring(content.indexOf(array[0]) + array[0].length + 1) // Skip past the sub-command
			user.quiz.addQuestion(array[0], createSurvey(content)) // Add and name the quiz question
		}
		else if (content.includes("!quiz remove")) { // Remove a question from the quiz
			user.quiz.removeQuestion(array[0]) // Remove the question from the quiz
		}
		else if (content.includes("!quiz start")) {
			message.channel.send({
				content: user.quiz.getMessage(0)
			}).then((msg) => {
				user.quiz.message = msg
				user.quiz.addOptions(0, 0)
			})
			.catch(() => {
				// None ?
			})
		}
		else if (content.includes("!quiz delete")) {
			//user.removeQuiz(quiz.name) // Remove the quiz from the User and itself
		}
		// May want to notify/alert
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