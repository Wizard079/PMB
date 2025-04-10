const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('messageBroker.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  console.log('Database opened successfully');
});

db.run(`CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic TEXT,
  message TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)`, (err) => {
  if (err) {
    console.error('Error creating table:', err.message);
  } else {
    console.log('Table created or already exists');
  }
});


function saveMessageToDatabase(topic, messageContent) {
  console.log("inside the savemsg")
  const stmt = db.prepare("INSERT INTO messages (topic, message) VALUES (?, ?)");
  stmt.run(topic, messageContent, function(err) {
    if (err) {
      console.error('Error saving message:', err);
    } else {
      console.log(`Message stored with ID ${this.lastID}`);
    }
  });
}

function getMessagesFromDatabase(topic, limit, callback) {
  console.log("Get is called")
  if (limit <= 0) { // get all the messages
    db.all("SELECT * FROM messages WHERE topic = ?", [topic], (err, rows) => {
      if (err) {
        console.error('Error retrieving messages:', err);
      } else {
        callback(rows);
      }
    });
  } else {
    db.all("SELECT * FROM messages WHERE topic = ? LIMIT ?", [topic, limit], (err, rows) => {
      if (err) {
        console.error('Error retrieving messages:', err);
      } else {
        callback(rows);
      }
    });
  }
}

module.exports = { saveMessageToDatabase, getMessagesFromDatabase };
