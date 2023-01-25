class User {
    static users = [] // Store all User objects
    user = null // Store the Discord user's data
    surveys = [] // Stores the a list of surveys, and reactions each user added
    reactions = [] // A 2d array of reactions, per each survey

    /*  @Params
        user - The Discord user who posted the reaction
        emoji - The specific reaction the user used on a survey
        survey - The survey the user is reactiong to
    */
    constructor(user, emoji, survey) {
        this.user = user // Set the user
        User.users.push(this) // Add the User object to the list of all of them
    }

    static getUser(user, emoji, survey) { // Returns the existing User object, if there is one
        for (var u of User.users) { // Loop through each User object
            if (u.user == user) { // The user has responded to a survey before, but not this one
                return(u) // Return the existing user
            }
        }
        return(new User(user, emoji, survey))
    }

    addSurveyReaction(emoji, survey) { // Returns whether or not a reaction was added
        if (Survey.pastSurveys.includes(survey)) { // The survey is no longer running
            return(false)
        }
        if (!this.surveys.includes(survey)) { // The survey doesn't exist for this user
            this.surveys.push(survey) // Add the survey to the list
            this.reactions.push([]) // Add a reaction list
        }
        var reactions = this.getSurveyReactions(survey) // Store the list of survey reactions
        if (!reactions.includes(emoji) && survey.isOption(emoji) && reactions.length < survey.maxSelection) {
            this.reactions[this.surveys.indexOf(survey)].push(emoji) // Add the reaction to the list
            survey.updateCount(1, emoji) // Update the voting count for the survey
            return(true)
        }
        return(false)
    }

    removeSurveyReaction(emoji, survey) { // Remove a reaction from a survey
        var reactions = [] // Store a list of kept reactions for the survey
        for (var r of this.getSurveyReactions(survey)) { // Loop through the user's survey reactions
            if (r != emoji) { // The reaction isn't the removed reaction
                reactions.push(r) // Add the reaction to the kept list
            }
            else {
                survey.updateCount(-1, emoji) // Update the voting count for the survey
            }
        }
        this.reactions[this.surveys.indexOf(survey)] = reactions // Update the survey reactions to be one less
        console.log("New Reactions: " + reactions)
    }

    getSurveyReactions(survey) { // Returns the reactions a user posted on a survey
        return(this.reactions[this.surveys.indexOf(survey)])
    }
}

class Survey {
    static activeSurvevys = [] // Store all current Survey objects
    static pastSurveys = [] // Store all previous Survey objects

    spaces = "    " // Number of spaces between each bullet point
    message = null // The Discord message this survey was sent in
    question = "" // The main question asked regarding the choices provided
    choices = [] // List of all the choices used in the survey 
    reactions = [] // List of all the reactions used in the survey
    results = [] // List of all voting results calculated in the survey
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
    constructor(query, options, emojis, selection, duration) {
        this.question = query // Set the asked question
        this.choices = options // Set the choices
        this.reactions = emojis // Set the reactions
        this.results = [] // Store the voting results
        this.maxSelection = selection // Set the max selection
        this.duration = duration // Set the duration
        for (var i=0; i<options.length; i++) { // Run the loop for as many options
            this.results.push(0) // Set the default poll value
        }
        Survey.activeSurvevys.push(this) // Add the survey to the active list
    }

    static findSurvey(message) { // Return the survey with that message, if there is one
        for (var s of [...Survey.activeSurvevys, ...Survey.pastSurveys]) { // Loop through all surveys
            if (s.message == message) { // The message matches the current survey
                return(s) // Return the survey
            }
        }
        return(null) // There was no survey
    }

    getMessage() { // Returns the formatted survey message
        var message = "*  **__Survey:__**  " + this.question + "\n" + this.spaces + "*" // Create the message header
        for (var i=0; i<this.choices.length; i++) { // Loop through the emojis/choices
            message += "\n" + this.spaces + "*\t" + this.reactions[i] + " " + this.choices[i] // Format the options
        }
        if (this.duration > 0) { // The runtime of the survey is valid
            this.timestamp = "<t:" + parseInt(Date.now()/1000 + this.duration * 60) + ":" + this.format + ">" // Set the duration's timestamp
            message += "\n" + this.spaces + "*\n*  **__Ends At:__** " + this.timestamp // Add the survey's timer
        }
        return(message) // Return the formatted message
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
                var results = "\n*  **__Survey Results:__**\n" + this.spaces + "*"
                var sum = 0 // Store the total amount of voters
                for (var n of this.results) { // Loop through results to get the sum
                    sum += n // Add to the sum
                }
                for (var i=0; i<this.results.length; i++) { // Loop through results to determine voting stats
                    results += "\n" + this.spaces + "*\t" +  this.reactions[i] + " " + (100 * this.results[i] / sum).toFixed(2) + "% Voted For "
                }
                results += "\n" + this.spaces + "*\n*  **__Ended At:__** " + this.timestamp // Conclude the bullet point formating
                this.message.edit(this.message.content.substring(0, this.message.content.indexOf("\n*  **__Ends At:__** ")) + results).then(() => {
                    Survey.activeSurvevys.splice(Survey.activeSurvevys.indexOf(this), 1) // Remove the survey from the list of active surveys
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

module.exports = { User, Survey }