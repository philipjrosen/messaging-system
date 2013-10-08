$(document).ready(function() {
  messagingSystem.init();
});

var messagingSystem = {

  init: function() {

    // Grab the HTML source that needs to be compiled by Handlebars
    inboxSource = $('#inbox-template').html();
    contactsSource = $('#contacts-template').html();
    inboxTemplate = Handlebars.compile(inboxSource);
    contactsTemplate = Handlebars.compile(contactsSource);
    storedContacts = [];
    storedContactNames = [];
    messageID: -1,
    userID = 1;
    //get the inbox
    ajaxHandlers.getInbox();

    //listen for changes in view
    $('#tabs a').on('click', function (e) {
      e.preventDefault();
      $(this).tab('show');
    });

    $('a[data-toggle="tab"]').on('shown', helpers.handleViews);
    $('#inbox-placeholder').on('click', 'a', helpers.retrieveMessage);
    $('a[href="#read-message"]').on('click', ajaxHandlers.getMessage);
  }
};

var ajaxHandlers = {

  getInbox: function() {
    $.ajax('/inbox', {
      type: 'GET',
      data: {recipientID: userID},
      success: function(response) {
        console.log("Current Inbox:", response);
        //send response to handelbars template
        var html = inboxTemplate(response);
        $('#inbox-placeholder').html(html);
        //store the contact info
        _.each(response.contacts, function(value) {
          storedContacts.push(value);
        });
        storedContacts = _.uniq(storedContacts);
        _.each(storedContacts, function(value) {
          storedContactNames.push(value.name);
        });
        storedContactNames = _.uniq(storedContactNames);
      },
      error: function(request, errorType, errorMessage) {
        console.log('Error: ' + errorType + '. Message: ' + errorMessage);
      },
      timeout: 3000
    });
  },

  getContacts: function() {
    $.ajax('/contacts', {
      type: 'GET',
      success: function(response) {
      //send to handelbars
        var html = contactsTemplate(response);
        $('#contacts-placeholder').html(html); 
      },
      error: function(request, errorType, errorMessage) {
        console.log('Error: ' + errorType + '. Message: ' + errorMessage);
      },
      timeout: 3000
    });
  },

  getMessage: function() {
    $.ajax('/message', {
      type: 'GET',
      data: {id: messageID},
      success: function(response) {
        helpers.showMessage(response);
      },
      error: function(request, errorType, errorMessage) {
        console.log('Error: ' + errorType + '. Message: ' + errorMessage);
      },
      timeout: 3000
    });
  },

  sendMessage: function(message) {
    $.ajax('/messages', {
      type: 'GET',
      data: message,
      dataType: 'json',
      contentType: 'application/json',
      success: function(response) {
        console.log("New message added to database:",response);
      },
      error: function(request, errorType, errorMessage) {
        console.log('Error: ' + errorType + '. Message: ' + errorMessage);
      },
      timeout: 3000
    });
  },

  markAsRead: function() {
    $.ajax('/markedread', {
      type: 'GET',
      data: {message_id: messageID},
      success: function(response) {
        console.log("Message marked as read in database:",response);
      },
      error: function(request, errorType, errorMessage) {
        console.log('Error: ' + errorType + '. Message: ' + errorMessage);
      },
      timeout: 3000
    });
  },

  deleteMessage: function() {
    $.ajax('/deletions', {
      type: 'GET',
      data: {message_id: messageID},
      success: function(response) {
        console.log("Message deleted from database:",response);
      },
      error: function(request, errorType, errorMessage) {
        console.log('Error: ' + errorType + '. Message: ' + errorMessage);
      },
      timeout: 3000
    });
  }
};

var helpers = {

  retrieveMessage: function(event) {
    event.preventDefault();
    messageID = $(this).closest('tr').data('id');
    $('li a[href="#read-message"]').css("visibility", "visible");
    $('li a[href="#read-message"]').trigger('click');
    ajaxHandlers.getMessage(messageID);
  },

  showMessage: function(response) {
    var message = _.findWhere(response.messages,{message_id: messageID});
    var content = message.content;
    var subject = message.subject;
    var sender = message.sender; 
    $("li a[href='#read-message']").text(subject);
    $("#sender").text("From: " + sender);
    helpers.createReadEditor();
    readEditor.importFile('x', content);
    readEditor.preview();
  },

  createReadEditor: function() {
    $("#epiceditor").remove();
    var html = '<div id="epiceditor"></div>';
    $("#read-message div.well").append(html);
    window.readEditor = new EpicEditor({
      basePath: '/lib/EpicEditor', 
      button: {preview: false, fullscreen: false, bar: false},
    }).load();
  },

  createWriteEditor: function() {
    $(".form-group").show();
    $("#epiceditor").remove();
    var html = '<div id="epiceditor"></div>';
    $("#editor-container").html(html);
    window.writeEditor = new EpicEditor({basePath: '/lib/EpicEditor'}).load();
  },

  handleSend: function(event) {
    event.preventDefault();
    var recipient = $("#input-email").val();
    var subject = $('#input-subject').val();
    var content = writeEditor.exportFile();
    var date = new Date();
    date = (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear();
    //with recipient get recipientID
    var recipientID = _.findWhere(storedContacts, {name: recipient}).user_id;

    var message = {
      message_id: Math.floor(Math.random() * 100000) + 25,
      subject: subject,
      sender: 'Philip Rosen',
      senderID: userID,
      recipient: recipient,
      reipientID: recipientID,
      content: content,
      createdAt: date,
      read: false
    }; 

    ajaxHandlers.sendMessage(message);

    //clear the editor
    writeEditor.importFile();

    $("#input-email").val("");
    $('#input-subject').val("");
    $(".form-group").hide();
    $("#form-legend").text("Message Sent");

  },

  handleCancel: function(event) {
    event.preventDefault();

    //clear the editor and input fields
    writeEditor.importFile();
    $("#input-email").val("");
    $('#input-subject').val("");

    //return to inbox
    $('#tabs a:first').trigger('click');
  },

  handleViews: function(event) {
    event.preventDefault();
    var view = $(this).attr('href');
    switch (view) {
      case "#inbox":
        ajaxHandlers.getInbox();
        break;
      case "#contacts":
        ajaxHandlers.getContacts();
        break;
      case "#read-message":
        $("#delete").on('click', function(e) {
          e.preventDefault();
          ajaxHandlers.deleteMessage(messageID);
          $('li a[href="#read-message"]').css("visibility", "hidden");
          $('#tabs a:first').trigger('click');   
        });
        $("#close").on('click', function(e) {
          e.preventDefault();
          ajaxHandlers.markAsRead(messageID);
          $('li a[href="#read-message"]').css("visibility", "hidden");
          $('#tabs a:first').trigger('click');   
        });
        break;
      case "#new-message":
        helpers.createWriteEditor();
        $("#input-email").focus();
        $("#input-email").autocomplete({
          source: storedContactNames,
          appendTo: '#autocomplete-container',
          messages: {
            noResults: '',
            results: function() {}
          }
        });
        $("#submit").on('click', helpers.handleSend);
        $("#cancel").on('click', helpers.handleCancel);
        $(this).on("click", function() {
          $("#form-legend").text("New Message");
          $(".form-group").show();
        });
        break;
      default:
        alert("Something has gone terribly wrong!");
    }
  }
};
