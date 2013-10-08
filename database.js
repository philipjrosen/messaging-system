var async = require('async');
var Schema = require('jugglingdb').Schema;

//connect to db
var schema = new Schema('mysql', {
  host: '',
  database: 'udacity',
  username: '',
  password: '',
  connectionLimit: 2,
  pool: true
});

//Define Models - juggling db
var User = schema.define('User', {
  name: String,
  addedOn: Date
});

var Message = schema.define('Message', {
  subject: String,
  content: Schema.Text,
  read: Boolean, //false by default
  createdAt: Date
});

var Group = schema.define('Group', {
  name: String
});

//Define Relationships
User.hasMany(Message, {as: 'sentMessages', foreignKey: 'senderID'});

Message.belongsTo(User, {as: 'sender', foreignKey: 'senderID'});

User.hasMany(Message, {as: 'receivedMessages', foreignKey: 'recipientID'});

Message.belongsTo(User, {as: 'recipient', foreignKey: 'recipientID'});

User.hasAndBelongsToMany('groups');


schema.automigrate();

module.exports = {

  acceptMessage: function(senderID, recipientID, subject, content, response) {
    var message = new Message;

    message.save({
      senderID: senderID,
      recipientID: recipientID,
      subject: subject,
      content: content
    });

  },
  serveInbox: function(userID, response) {
    User.find(userID, function(user) {
      response.send(user.receivedMessages);
    });
  },
  serveMessage: function(messageID, response) {
    Message.find(messageID, response.send);
  },
  deleteMessage: function(messageID) {
    Message.find(messageID, function(message) {
      message.destroy(function() {
        response.send(200);
      });
    });
  },
  serveUserNames: function(response) {
    User.all(response.send);
  },
  serveGroupNames: function(response) {
    Group.all(response.send);
  }
};
