'use strict';
const nodemailer = require('nodemailer');
const Email = require('email-templates');
const fs = require('fs');
const config = require('./config');

/**
 * input your username (email address from)
 * input your password
 */

let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: '**',
    pass: '**'
  }
});

const readHTMLFile = function(path, callback) {
  fs.readFile(path, {encoding: 'utf-8'}, function (err, html) {
      if (err) {
          throw err;
          callback(err);
      }
      else {
          callback(null, html);
      }
  });
};

readHTMLFile(__dirname + '/dist/en/default.html', function(err, template) {
  let mailOptions = config(template)

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        return console.log(error);
    }
    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  });
});




