const { Survey } = require("./survey.js");

class Quiz {
    message = null // The Discord message the quiz is being displayed on
    questions = [] // List of survey questions for the quiz
    labels = [] // List of names for each question
    validity = [] // 2D List of booleans for whether or not the choices are right
    index = 0 // The index of the current question being ran
    default_time = 30 // Default time of the question timer
    default_interval = 10 // Default time of the interval timer
    interval = 10 // The number of seconds to display the right/wrong answers
    duration = 30 // The remaining duration of the quiz questions in seconds
    elapsed = 30 // The time elapsed (should match duration before time changes)

    constructor() {

    }

    getAnswers(i) {
        /* Colored Discord Text:
            ```diff
            +Hello World
            -Hello World
            ```
        */
        var survey = this.questions[i] // Store the survey
        var header = "*\t**__Time Remaining__:**  " + this.duration + " Seconds" // Create the quiz header
        var message = "\n*\t***__" + this.labels[i] + ":__***" + "\n*\t" + survey.question + "\n*" // Create the message
        for (var q=0; q<survey.choices.length; q++) { // Loop through and add the choices
            message += "\n*\t" + (this.validity[i][q] ? " CORRECT " : "   WRONG   ") + survey.reactions[q] + "  " + survey.choices[q] // Add the formatted option to the message
        }
        message += "\n*"
        var spacer = "*   ".repeat(16).trim() // Create the spacer
        // \/ NOT NEEDED ??? \/
        for (var i of message.split("\n")) { // Loop through each line to see if will fit in spacer
            var count = 0 // Count the number of characters displayed per line
            for (var j of i) { // Loop through each character in the line
                count += j == '\t' ? 4 : 1 // Add the number of characters displayed
            }
            if (count/3 > 16) { // Display length is larger than the spacer
                spacer = "*   ".repeat(count/3).trim() // Increase the spacer length
            }
        }
        return(header + "\n" + spacer + message + "\n" + spacer)
    }

    getMessage(i) {
        var survey = this.questions[i] // Store the survey
        // Question Name Italisized ??? 
        var header = "*\t**__Time Remaining__:**  " + this.duration + " Seconds" // Create the quiz header
        var message = "\n*\t***__" + this.labels[i] + ":__***" + "\n*\t" + survey.question + "\n*" // Create the message
        for (var q=0; q<survey.choices.length; q++) { // Loop through and add the choices
            message += "\n*\t" + survey.reactions[q] + "  " + survey.choices[q] // Add the formatted option to the message
        }
        message += "\n*"
        var spacer = "*   ".repeat(16).trim() // Create the spacer
        // \/ NOT NEEDED ??? \/
        for (var i of message.split("\n")) { // Loop through each line to see if will fit in spacer
            var count = 0 // Count the number of characters displayed per line
            for (var j of i) { // Loop through each character in the line
                count += j == '\t' ? 4 : 1 // Add the number of characters displayed
            }
            if (count/3 > 16) { // Display length is larger than the spacer
                spacer = "*   ".repeat(count/3).trim() // Increase the spacer length
            }
        }
        // Timer somehow ???
        return(header + "\n" + spacer + message + "\n" + spacer)
    }

    getResults() {
        var header = "*\t**__Quit Has Concluded__**"
        var message = "\n*"
        for (var i=0; i<this.questions.length; i++) {
            var survey = this.questions[i]
            var correct = 0 // Total correct votes cast
            var total = 0 // Total votes cast
            for (var j=0; j<survey.results.length; j++) { // Loop through each option
                total += survey.results[j] // Add the total votes cast
                if (j + 1 <= survey.validAnswers) { // The answer is valid
                    correct += survey.results[j] // Add the correct votes cast
                }
            }
            message += "\n*\t*__" + this.labels[i] + ":__*\n*\t\t" + (100 * correct / total).toFixed(2) + "% of users got it right."
        }
        var spacer = "*   ".repeat(16).trim() // Create the spacer
        // \/ NOT NEEDED ??? \/
        for (var i of message.split("\n")) { // Loop through each line to see if will fit in spacer
            var count = 0 // Count the number of characters displayed per line
            for (var j of i) { // Loop through each character in the line
                count += j == '\t' ? 4 : 1 // Add the number of characters displayed
            }
            if (count/3 > 16) { // Display length is larger than the spacer
                spacer = "*   ".repeat(count/3).trim() // Increase the spacer length
            }
        }
        message += "\n*"
        return(header + "\n" + spacer + message + "\n" + spacer)
    }

    addOptions(i, j) {
        var survey = this.questions[i] // Store the survey
        if (j < survey.choices.length) {
            if (j == 0) {
                console.log("Activated Survey #" + (i + 1))
                survey.message = this.message // Set the survey message
                Survey.activeSurveys.push(survey) // Make the survey active
            }
            this.message.react(survey.reactions[j]).then(() => { // Wait until the reaction is added
                console.log("Added Reaction #" + (j+1))
                this.addOptions(i, j + 1)
            })
            return // Quit the method
        }
        var timer = null // Store the interval timer
        timer = setInterval(() => {
            if (this.elapsed == this.duration) { // The two time counts are accurate
                if (this.elapsed == 0) { // The timer for the question has ended
                    Survey.activeSurveys.splice(Survey.activeSurveys.indexOf(survey), 1) // Remove the survey from the active list
                    Survey.pastSurveys.push(survey) // Deactivate the survey
                    this.elapsed = this.default_time // Set half of the duration timers
                    this.message.edit(this.getAnswers(i)).then((msg) => { // Display the answers to the question
                        timer = clearInterval(timer) // Clear the timer
                        this.message = msg // Update the message content
                        console.log("Displayed Answers #" + (i + 1))
                        if (i + 1 == this.questions.length) { // Looped through all the questions
                            console.log("Quiz Has Concluded")
                            survey.message = null
                            this.message.edit(this.getResults()).then((msg) => {
                                this.elapsed = this.default_time
                                this.duration = this.default_time
                                this.interval = this.default_interval
                                // None ?
                            })
                            return // Quit the method
                        }
                        setTimeout(() => { // Freeze the answers for the alotted interval
                            console.log("Shifting to the next question...")
                            this.duration = this.default_time // Set the other half of the duration timers
                            this.message.reactions.removeAll().then(() => { // Remove all reactions from the message
                                survey.message = null // Disassociate the survey's message with the quiz's message
                                this.message.edit(this.getMessage(i + 1)).then((msg) => { // Update the question display
                                    this.message = msg // Update the message content
                                    this.addOptions(i + 1, 0) // Add the reactions to the next question.
                                })
                            })
                        }, this.interval * 1000)
                    })
                }
                else { // It's time to deduct a second from the timer
                    this.duration -= 1 // Take a second off of the duration timer
                    this.message.edit(this.message.content.substring(0, this.message.content.indexOf((this.duration + 1) + " Seconds")) + this.duration + " Seconds" + this.message.content.substring(this.message.content.indexOf("Seconds") + 7)).then((msg) => {
                        this.message = msg // Update the message content
                        this.elapsed -= 1 // Take a second off of the elapsed timer
                    })
                }
            }
        }, 1000)
    }

    addQuestion(name, survey) {
        this.questions.push(survey) // Add the survey to the list of questions
        this.labels.push(name) // Add the survey's name to the list of labels
        var index = this.questions.indexOf(survey) // Store the index of the survey
        this.validity[index] = [...survey.choices] // Get the survey's choices
        for (var i=0; i<survey.reactions.length; i++) { // Loop through each choice in the question
            this.validity[index][i] = i < survey.validAnswers ? true : false // Set the validity of the options
        }
        for (var i=0; i<survey.reactions.length; i++) { // Randomly swap the positions of the options
            var rand = parseInt(Math.random() * (survey.reactions.length - i)) // Calculate a random index to swap with
            var temp = this.validity[index][rand] // Store the validity
            this.validity[index][rand] = this.validity[index][i] // Swap the validities
            this.validity[index][i] = temp // Swap the validities
            temp = survey.choices[rand] // Store the choices
            survey.choices[rand] = survey.choices[i] // Swap the choices
            survey.choices[i] = temp // Swap the choices
            temp = survey.reactions[rand] // Store the reactions
            survey.reactions[rand] = survey.reactions[i] // Swap the reactions
            survey.reactions[i] = temp // Swap the reactions
        }
    }

    removeQuestion(name) {
        this.questions = this.questions.splice(this.labels.indexOf(name), 1) // Cut the survey out of the question list
        this.labels = this.labels.splice(this.labels.indexOf(name), 1) // Cut the survey's name out of the label list
    }

}

module.exports = { Quiz }