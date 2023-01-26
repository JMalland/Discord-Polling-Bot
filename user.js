const { Survey } = require('./survey.js') // Import the Survey class
const { Quiz } = require('./quiz.js') // Import the Quiz class

class User {
    static users = [] // Store all User objects
    user = null // Store the Discord user's data
    surveys = [] // Stores the list of surveys, and reactions each user added
    reactions = [] // A 2d array of reactions, per each survey
    quiz = null // A quiz created by the user, specifically

    /*  @Params
        user - The Discord user who posted the reaction
        emoji - The specific reaction the user used on a survey
        survey - The survey the user is reactiong to
    */
    constructor(user) {
        this.user = user // Set the user
        User.users.push(this) // Add the User object to the list of all of them
    }

    static getUser(user) { // Returns the existing User object, if there is one
        for (var u of User.users) { // Loop through each User object
            if (u.user == user) { // The user has responded to a survey before, but not this one
                return(u) // Return the existing user
            }
        }
        return(new User(user)) // Return the newly created user
    }

    getQuiz() {
        if (this.quiz != null) { // The user already has a quiz
            return(this.quiz) // Return the already present Quiz
        }
        this.quiz = new Quiz() // Create a new, empty Quiz
        return(this.quiz) // Return the newly created quiz
    }

    addSurveyReaction(emoji, survey) { // Returns whether or not a reaction was added
        if (survey == null || Survey.pastSurveys.includes(survey)) { // The survey is no longer running
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
        if (Survey.pastSurveys.includes(survey) || survey == null) { // The survey is no longer running
            return
        }
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

module.exports = { User }