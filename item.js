// Attempt at storing data

const { LocalStorage } = require('node-localstorage')
const localStorage = new LocalStorage('./scratch');
class Item {
    #id = null
  
    constructor(id, value) {
        this.#id = id
        if (this.getValue() === null) {
            localStorage.setItem(this.#id, JSON.stringify(value))
        }
    }
  
    getValue() {
        return(JSON.parse(localStorage.getItem(this.#id)))
    }
  
    setValue(n) {
        localStorage.setItem(this.#id, JSON.stringify(n))
    }
}

// JSON.parse(str)
// JSON.stringify(obj)

const backup_size = new Item('backup_size', 50)
const storage_array = new Item('storage_array', [])
const archive = new Item('archive', [])

function addToStorage(obj) {
    temp = storage_array.getValue() // Get the array
    temp.push(obj) // Add the object to the array
    if (temp.length > backup_size.getValue()) { // Array is too large
        temp.shift() // Removes the top value from the array
    }
    storage_array.setValue(temp) // Update the array
}

function getFromStorage(i) {
    return(storage_array.getValue().get(i)) // Return the indexed object
}

function clearStorage() {
    temp = storage_array.getValue() // Get the array
    for (o of temp) { // Loop through each message
        o.message.delete() // Delete the message
    }
}

function archiveFromStorage(id) {
    temp = storage_array.getValue() // Get the array
    for (o of temp) { // Loop through each message
        if (o.message.id == id) { // The object matches the id
            update = archive.getValue().push(o)// Add the object
            archive.setValue(update) // Update the archive
            temp = temp.splice(temp.indexOf(o), 1) // Remove from storage
            storage_array.setValue(temp) // Update the array
            return
        }
    }
}

module.exports = { Item }