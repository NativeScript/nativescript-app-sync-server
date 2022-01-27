import _ from 'lodash'
import nodemailer from 'nodemailer'
import { AppError } from '../app-error';
import config from '../config'

export const sendMail = function (options) {
  return new Promise((resolve, reject) => {
    if(!_.get(options, 'to')) {
      return reject(new AppError("to is mandatory"));
    }
    var smtpConfig = _.get(config, 'smtpConfig');
    if (!smtpConfig) {
      resolve({});
    }
    var transporter = nodemailer.createTransport(smtpConfig);
    var sendEmailAddress = _.get(smtpConfig, 'auth.user');
    var defaultMailOptions = {
      from: `"NativeScript AppSync Server" <${sendEmailAddress}>`, // sender address
      to: '', // list of receivers (passed in)
      subject: 'NativeScript AppSync Server', // Subject line
      html: '' // html body
    };
    var mailOptions = _.assign(defaultMailOptions, options);
    transporter.sendMail(mailOptions, function(error, info){
      if(error){
        return reject(error);
      }
      resolve(info);
    });
  });
};

export const sendRegisterCode = function (email: string, code: string) {
  return sendMail({
    to: email,
    html: `<div>Your verification code: <em style="color:red;">${code}</em> (valid for 20 minutes)</div>`
  });
};

