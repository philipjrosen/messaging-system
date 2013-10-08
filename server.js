var express = require('express');
var data = require('./data');
var url = require('url');
msgs = data.messages;
// var db = require('./database');
var helpers = {

  markRead: function(messageID) {
    for(var i = 0; i < msgs.length; i++) {
      if(msgs[i].message_id == messageID) {
        msgs[i].read = true;
      }
    }
  },

  addRecord: function(message) {
    data.messages.push(message);
  },

  deleteRecord: function(messageID) {
    for(var i = 0; i < msgs.length; i++) {
      if(msgs[i].message_id == messageID) {
        msgs.splice(i, 1);
      }
    }
  },

  filterInbox: function(recipientID) {
    var filteredInbox = msgs.filter(function(element) {
      return element.recipientID == recipientID;
    });
    return filteredInbox;
  }
};

var handlers  = {

  serveInbox: function(req, res, next) {
    var filteredInbox = helpers.filterInbox(req.query.recipientID);
    var newInbox = {};
    newInbox.messages = filteredInbox;
    newInbox.contacts = data.contacts;
    res.send(newInbox);
  },

  serveContacts: function(req, res, next) {
    res.send(data);
  },

  serveMessage: function(req, res, next) {
    var query = req.query;
    res.send(data);
  },

  acceptMessage: function(req, res, next) {
    var message = req.query;
    helpers.addRecord(message);
    res.send(message);
  },

  deleteMessage: function(req, res, next) {
    var query = req.query;
    helpers.deleteRecord(req.query.message_id);
    res.send('204');
  },

  markMessage: function(req, res, next) {
    var query = req.query;
    helpers.markRead(req.query.message_id);
    res.send('204');
  }
};

var server = express();

server.use(express.bodyParser());
//handle requests to serve inbox
server.get('/inbox', handlers.serveInbox);
server.head('/inbox', handlers.serveInbox);

//handle requests to serve contacts
server.get('/contacts', handlers.serveContacts);
server.head('/contacts', handlers.serveContacts);

//handle posts of messages
server.get('/messages', handlers.acceptMessage);

//handle deletion of records given an id
server.get('/deletions', handlers.deleteMessage);

//handle request to mark messages as read
server.get('/markedread', handlers.markMessage);

//handle requests to serve a message given an id
server.get('/message', handlers.serveMessage);
server.head('/message', handlers.serveMessage);

//serve the static assets
server.use(express.static(__dirname + '/public'));

server.listen(8080);
