// New Quiz Feature?
//     Make multiple surveys, with correct answers
//          - Point value associations per option/answer
//          - Scoring/Ranking system?
//          - Roles/Titles/Stuff                                                                             

class Survey {
    static activeSurveys = [] // Store all current Survey objects
    static pastSurveys = [] // Store all previous Survey objects
    
    isRunning = false // Whether or not the survey is active
    spaces = "    " // Number of spaces between each bullet point
    footer = "" // The message displayed with the results
    message = null // The Discord message this survey was sent in
    question = "" // The main question asked regarding the choices provided
    choices = [] // List of all the choices used in the survey 
    reactions = [] // List of all the reactions used in the survey
    results = [] // List of all voting results calculated in the survey
    validAnswers = 1 // Number of valid answers
    extendResults = true // Whether or not results are displayed in addition to the initial message, or they replace it
    maxSelection = 1 // The maximum amount of options a single user can select
    duration = 0 // The amount of time in minutes, before the survey ends.
    timestamp = "" // The timestamp of the survey's duration
    format = "F" // The format of the survey timestamp

    /*  @Params
        query - The question being asked in the survey
        options - The choices represented by each emoji
        emojis - The emojis used to select choice(s)
        selection - The max number of votes a user may cast
        duration - The length of time (in minutes) the survey should run for
    */
    constructor(header, options, emojis, footer, selection, duration, answers) {
        this.question = options[0] // Set the asked question
        this.choices = options.slice(1) // Set the choices
        this.reactions = emojis // Set the reactions
        this.results = [] // Store the voting results
        this.maxSelection = selection // Set the max selection
        this.duration = duration // Set the duration
        this.header = header // Set the header
        this.footer = footer // Set the footer
        this.validAnswers = answers // Set the valid answer count 
        for (var i=0; i<options.length - 1; i++) { // Run the loop for as many options
            this.results.push(0) // Set the default poll value
        }
        this.isRunning = true // Set the survey as active
        Survey.activeSurveys.push(this) // Set the survey as active 
    }

    static findSurvey(message) { // Return the survey with that message, if there is one
        for (var s of [...Survey.activeSurveys, ...Survey.pastSurveys]) { // Loop through all surveys
            if (s.message != null && s.message.id == message.id) { // The message matches the current survey
                return(s) // Return the survey
            }
        }
        return(null) // There was no survey
    }

    getTimestamp() {
        return("<t:" + parseInt(Date.now()/1000 + this.duration * 60) + ":" + this.format + ">") // Return the timestamp
    }

    getMessage() { // Returns the formatted survey message
        var message = this.header + this.question + "\n" + this.spaces + "*" // Create the message header
        for (var i=0; i<this.choices.length; i++) { // Loop through the emojis/choices
            message += "\n" + this.spaces + "*\t" + this.reactions[i] + "  " + this.choices[i] // Format the options
        }
        this.timestamp = this.getTimestamp()
        message += "\n" + this.spaces + "*\n*  **__Ends At:__** " + this.timestamp // Add the survey's timer
        return(message) // Return the formatted message
    }

    #getResults() { // Returns the formatted survey results
        var results = "\n" + this.footer + "\n" + this.spaces + "*"
        var sum = 0 // Store the total amount of voters
        for (var n of this.results) { // Loop through results to get the sum
            sum += n // Add to the sum
        }
        for (var i=0; i<this.results.length; i++) { // Loop through results to determine voting stats
            results += "\n" + this.spaces + "*\t" +  this.reactions[i] + " " + (100 * this.results[i] / sum).toFixed(2) + "% Voted For "
        }
        return(results + "\n" + this.spaces + "*\n*  **__Ended At:__** " + this.timestamp) // Conclude the bullet point formating
    }

    #addReaction(i) { // Add the indexed reaction, if it exists
        if (i < this.reactions.length) { // The reaction index is valid
            this.message.react(this.reactions[i]).then(() => { // Wait until the reaction is added
                console.log("Added Reaction #" + (i+1))
                this.#addReaction(i + 1) // Add the next reaction, if it exists
            })
        }
        else { // Finally ran out of options to add
            setTimeout(() => {
                this.message.edit(this.message.content.substring(0, this.message.content.indexOf(this.extendResults ? "\n*  **__Ends At:__** " : "")) + this.#getResults()).then(() => {
                    Survey.activeSurveys.splice(Survey.activeSurveys.indexOf(this), 1) // Remove the survey from the list of active surveys
                    Survey.pastSurveys.push(this) // Add the survey to the list of past surveys
                    console.log("Concluded Survey")
                })
            },  this.duration * 60 * 1000)
        }
    }

    updateCount(num, emoji) {
        this.results[this.reactions.indexOf(emoji)] += num // Increase or decrease the counted votes for the reaction type
    }

    isOption(emoji) { // Returns whether or not a reaction is an option
        return(this.reactions.includes(emoji))
    }

    getOption(emoji) { // Returns the option being represented by the emoji
        return(this.options[this.reactions.indexOf(emoji)])
    }

    addOptions() { // Adds the reaction options to the survey
        this.#addReaction(0) // Start the initial reaction chain
    }
}

module.exports = { Survey }