// Require the necessary discord.js classes
const { Survey } = require('./survey.js') // Import the Survey class
const { User } = require('./user.js') // Import the User class
const { Quiz } = require('./quiz.js') // Import the Quiz class
//const { Item } = require('./item.js') // Import the Item class
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
	var myRegexp = /[^\s"]+|"(?:\\"|[^"])*"/g // https://stackoverflow.com/questions/2817646/javascript-split-string-on-space-or-on-quotes-to-array
	do {
	    // Each call to exec returns the next regex match as an array
	    var match = myRegexp.exec(content)
	    if (match != null) {
	        // Index 1 in the array is the captured group if it exists
	        // Index 0 is the matched text, which we use if no captured group exists
	        results.push(match[1] ? match[1].substring(1, match[1].length - 1) : match[0].substring(1, match[0].length - 1))
	    }
	} while (match != null)
	return(results)
}

function grabEmotes(content, quotes) {
	// Will need to check individually to see if the emoji index is chronologically found within a quote.
	// \/ New Emoji Parser, Should Work better \/
	var temp = content.match(/(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/).input // Kevin Scott way of emoji parsing --> https://stackoverflow.com/questions/37089427/javascript-find-emoji-in-string-and-parse
	var results = [] // Empty array to hold all the emojis found before quotes
	for (var i of temp.trim().split(/\s+/)) { // Loop through all extra emojis found
		results.push(i) // Add the split emoji to the temp array
	}
	return(results) // Return the emojis found outside of " quotes in the command
}

// !survey  [--time | -t] [--choices | -c] [--answers | -a] <question> <reactions...> <options...>
function createSurvey(message) {
	FORMAT = "F"
	console.log("Conducting Survey")
	message = message.replace("\\\\", '\\')

	parameter_symbols = [
		["--time", "-t"], // Time indicator
		["--choices", "-c"], // Choices indicator
		["--answers", "-a"], // Answers indicator
		["\""] // Question indicator
	]

	survey_values = [30, 1, 0, ""]

	for (var t=0; t<parameter_symbols.length; t++) {
		for (var i of parameter_symbols[t]) { // Loop through the parameter's indicators
			if (message.includes(i)) { // Message includes the indicator
				if (i.includes("-")) { // The parameter is optional
					var value = message.substring(message.indexOf(i) + i.length + 1) // Store the parameter, after it's indicator
					value = value.substring(0, value.indexOf(" ")) // Get the value up to the next space
					message = message.substring(message.indexOf(value) + value.length + 1) // Skip through message content
					value = parseInt(value) // Store the parameter as an integer
					survey_values[t] = isNaN(value) || value < 1 ? survey_values[t] : value // Store the survey value, if it is within a valid range
				}
				else { // The parameter is the question
					message = message.substring(message.indexOf(i) + 1) // Store the parameter, after the indicator
					var value = "" // Store the real parameter value
					do {
						value += message.substring(0, message.indexOf(i)) + (message.charAt(message.indexOf(i) - 1) == '\\' ? '"' : "")
						message = message.substring(message.indexOf(i) + 1) // Skip through message content
					} while (message.includes(i) && message.charAt(message.indexOf(i) - 1) == '\\')
					message = message.substring(1) // Skip the next space
					value = value.replace('\\"', '"') // Replace any escaped quotes with just plain quotes
					survey_values[t] = value // Set the survey value
				}
			}
		}
	}

	var reactions = grabEmotes(message.substring(0, message.indexOf("\""))) // Store all emojis before the quotes
	var quotes = grabQuotes(message.substring(message.indexOf("\""))) // Store all quoted options after the emojis
	quotes.unshift(survey_values[3]) // Add the question to the list of quotes

	console.log(quotes)
	console.log(reactions)
	console.log(survey_values)

	return(new Survey("*  **__Survey:__**  ", quotes, reactions, "*  **__Survey Results:__**  ", survey_values[1], survey_values[0], survey_values[2])) // Create the new survey
}

client.on("messageCreate", async (message) => {
	try {
		if (message.author.bot) {
			return
		}
		var content = message.content // Simplify message content
		var user = User.getUser(message.author) // Create or get the user
		var command = message.content.split(" ")[0] // Store the command executed
		/* Survey Command:
		*	   !survey  [--time | -t] [--choices | -c] [--answers | -a] <question> <reactions...> <options...>
		*/
		/*  Quiz Command:
		*	   !quiz add <title> [--choices | -c] [--answers | -a] <question> <reactions...> <options...>
		*	   !quiz remove <title>		// Remove the indexed question from the quiz
		*	   !quiz clear				// Delete the quiz
		*	   !quiz start				// Run the quiz
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
			for (var line of content.split("\n")) {
				var array = grabQuotes(line.substring(line.indexOf('"'))) // The individual components of the command
				user.quiz = user.getQuiz() // Get the quiz from the user
				if (line.includes("!quiz add")) { // Add a question to the quiz
					line = line.substring(line.indexOf(array[0]) + array[0].length + 1) // Skip past the sub-command
					user.quiz.addQuestion(array[0], createSurvey(line)) // Add and name the quiz question
					console.log("Added Question: " + array[0])
				}
				else if (line.includes("!quiz remove")) { // Remove a question from the quiz
					user.quiz.removeQuestion(array[0]) // Remove the question from the quiz
				}
				else if (line.includes("!quiz start") && !user.quiz.isRunning) { // User wishes to start their quiz
					user.quiz.isRunning = true
					message.channel.send({
						content: user.quiz.getMessage(0)
					}).then((msg) => {
						user.quiz.message = msg
						user.quiz.addOptions(0, 0)
					})
					.catch(() => {
						user.quiz.isRunning = false
						// None ?
					})
				}
				else if (line.includes("!quiz clear")) { // User wishes to clear their quiz
					user.quiz = new Quiz() // Create a whole new quiz	
				}
			}

			message.delete() // Delete the user's message to avoid knowledge of the correct answers
		}
	}
	catch (e) {
		// None ?
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