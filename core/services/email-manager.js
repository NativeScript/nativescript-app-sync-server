'use strict';
var Promise = require('bluebird');
var models = require('../../models');
var _ = require('lodash');
var validator = require('validator');
var security = require('../utils/security');
var moment = require('moment');
const sgMail = require('@sendgrid/mail')

var config = require('../config');
sgMail.setApiKey(config.SENDGRID_API_KEY)

var proto = module.exports = function (){
  function EmailManager() {

  }
  EmailManager.__proto__ = proto;
  return EmailManager;
};

proto.sendMail = function (options) {
  return new Promise((resolve, reject) => {
    if(!_.get(options, 'to')) {
      return reject(new AppError.AppError("to is mandatory"));
    }
    var smtpConfig = _.get(config, 'smtpConfig');
    if (!smtpConfig) {
      resolve({});
    }
    var sendEmailAddress = _.get(smtpConfig, 'auth.user');
    var defaultMailOptions = {
      from: `"NativeScript AppSync Server" <${sendEmailAddress}>`, // sender address
      to: '', // list of receivers (passed in)
      subject: 'NativeScript AppSync Server', // Subject line
      html: '' // html body
    };

    var mailOptions = _.assign(defaultMailOptions, options);
    sgMail
      .send(mailOptions)
      .then((response) => {
        console.log(response[0].statusCode)
        console.log(response[0].headers)
        return resolve(response);
      })
      .catch((error) => {
        console.error(error)
        return reject(error);
      })
    // transporter.sendMail(mailOptions, function(error, info){
    //   if(error){
    //     return reject(error);
    //   }
    //   resolve(info);
    // });
  });
};

proto.sendRegisterCode = function (email, code) {
  return proto.sendMail({
    to: email,
    html: `<div>Your verification code: <em style="color:red;">${code}</em> (valid for 20 minutes)</div>`
  });
};


