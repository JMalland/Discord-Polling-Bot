
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
			if (emoji < start) { // The emoji is found prior to the quote
				break // Quit the loop
			}
			else if (emoji > start && emoji < end) { // The emoji is found within the quote
				results.splice(results.indexOf(e), 1); // Remove the emoji from the list
				content = content.substring(emoji + 1) // Skip past the current emoji
				break // Quit the loop
			}
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
	emotes = grabEmotes(message.content, quotes) // Store all the emojis used in the survey
	
	times = message.content.substring(message.content.indexOf(quotes[quotes.length - 1]) + quotes[quotes.length - 1].length + 1).trim() // Cut out the time requirement, if it exists
	
	if (times.includes(":")) { // The survey request has a time constraint
		times = times.split(":")
	}
	else { // The survey request lasts for the default amount of time
		times = [0, 0, 0, 0]
	}

	// Values Per Unit
	HOURS = 24
	MINUTES = 60
	SECONDS = 60

	// Defeault Values For Each Reset
	DEFAULT_SECONDS = 60
	DEFAULT_MINUTES = 60
	DEFAULT_HOURS = 24

	// Days, Hours, Minutes, & Seconds ~ Time Values
	d = parseInt(times[0]) // Number of days
	h = parseInt(times[1]) // Number of hours
	m = parseInt(times[2]) // Number of minutes
	s = parseInt(times[3]) // Number of seconds

	timestamp = "<t:" + (parseInt(Date.now()/1000) + (d * HOURS * MINUTES * SECONDS) + (h * MINUTES * SECONDS) + (m * SECONDS) + s) + ":R>" + "<t:" + (parseInt(Date.now()/1000) + (h * MINUTES * SECONDS) + (m * SECONDS) + s) + ":R>" + "<t:" + (parseInt(Date.now()/1000) + (m * SECONDS) + s) + ":R>" + "<t:" + (parseInt(Date.now()/1000) + s) + ":R>"

	// Days, Hours, Minutes, & Seconds ~ Timestamp Countdown Timers
	dStamp = d == 0 ? "" : "<t:" + (parseInt(Date.now()/1000) + (d * HOURS * MINUTES * SECONDS) + (h * MINUTES * SECONDS) + (m * SECONDS) + s) + ":R>"
	hStamp = h == 0 ? "" : "<t:" + (parseInt(Date.now()/1000) + (h * MINUTES * SECONDS) + (m * SECONDS) + s) + ":R>"
	mStamp = m == 0 ? "" : "<t:" + (parseInt(Date.now()/1000) + (m * SECONDS) + s) + ":R>"
	sStamp = s == 0 ? "" : "<t:" + (parseInt(Date.now()/1000) + s) + ":R>"
	
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
		content: header + "\n *\t" + body + "\n * Ends In: " + timestamp
	}).then((message) => { // Add the options to the survey
		for (e of emotes) { // Loop through the options
			if (e != "") { // The emoji is not null
				message.react(e) // Add the emoji reaction
			}
		}
		SEC = setTimeout(() => {
			// Reset Seconds Timer To 60s
			var interval = () => {
				clearStamp = (val, stamp) => {
					if (val <= 0) {
						message.edit(message.content.replace(stamp, "")).then((edit) => { // Clear the timestamp
							message.content = edit.content // Update the message content to reflect the edit
							console.log("Cleared A Timestamp.")
						})
					}
				}
				changeSeconds = () => {
					console.log("Updated Seconds.")
					temp = "<t:" + parseInt(Date.now()/1000 + DEFAULT_SECONDS) + ":R>" // Temporary timestamp
					message.edit(message.content.replace(sStamp, temp)).then((edit) => { // Update the message to show T-60 seconds
						message.content = edit.content // Update the message content to reflect the edit
					})
					sStamp = temp // Update sStamp to equal the current secondstamp
					m -= 1 // Subtract one minute
				}
				changeMinutes = () => {
					if (s != 0) { // Seconds counter is not 0
						return // Quit the method
					}
					console.log("Updated Minutes.")
					temp = "<t:" + parseInt(Date.now()/1000 + DEFAULT_MINUTES * SECONDS) + ":R>" // Temporary timestamp
					message.edit(message.content.replace(mStamp, temp)).then((edit) => { // Update the message to show T-60 minutes
						message.content = edit.content // Update the message content to reflect the edit
					})
					mStamp = temp // Update mStamp to equal the current minutestamp
					h -= 1 // Subtract one hour
					changeSeconds() // Update the seconds timestamp
				}
				changeHours = () => {
					if (m != 0 || s != 0) { // Minutes or seconds counter is not 0
						return // Quit the method
					}
					console.log("Updated Hours.")
					temp = "<t:" + parseInt(Date.now()/1000 + DEFAULT_HOURS * MINUTES * SECONDS) + ":R>" // Temporary timestamp
					message.edit(message.content.replace(hStamp, temp)).then((edit) => { // Update the message to show T-24 hours
						message.content = edit.content // Update the message content to reflect the edit
					})
					hStamp = temp // Update hStamp to equal the current hourstamp
					d -= 1 // Subtract one day
					changeMinutes() // Update the minutes timestamp
				}

				if (m - 1 >= 0) { // 0 Seconds, but remaining minutes 
					changeSeconds() // Adjust the current seconds display
				}
				else if (m - 1 == 0 && h - 1 >= 0) { // 0 Minutes : 0 Seconds, but remaining hours
					changeMinutes() // Adjust the current minutes display
				}
				else if (m - 1 == 0 && h - 1 == 0 && d - 1 >= 0) { // 0 Hours : 0 Minutes : 0 Seconds, but remaining days
					changeHours() // Adjust the current hours display
				}
				else { // 0 Days : 0 Hours : 0 Minutes : 0 Seconds
					clearInterval(this) // Clear the interval, so it stops updating.
				}

				clearStamp(s, sStamp) // Clear the secondstamp, if necessary
				clearStamp(m, mStamp) // Clear the minutestamp, if necessary
				clearStamp(h, hStamp) // Clear the hourstamp, if necessary
				clearStamp(d, dStamp) // Clear the daystamp, if necessary
			}
			interval() // Run the interval method to update the content.
			setInterval(interval, SECONDS * 1000) // Set the interval timer to run per minute
			// NEED SOME WAY TO STOP INTERVAL TIMER
		}, s * 1000)
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