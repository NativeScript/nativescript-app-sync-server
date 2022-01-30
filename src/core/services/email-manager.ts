import nodemailer, { TestAccount, SentMessageInfo } from 'nodemailer'
import SMTPTransport from 'nodemailer/lib/smtp-transport'
import config from '../config'

const {
  host, port, secure, auth, tls
} = config.smtpConfig

const sendEmailTest = async (mailOptions: any) => {
  return nodemailer.createTestAccount((err: Error | null, account: TestAccount) => {
    let transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: account.user,
        pass: account.pass
      }
    })
    return transporter.sendMail(mailOptions, (error: Error | null, info: any) => {
      if (error) {
        console.log('TCL: sendEmailTest -> error', error)
        return { error, data: undefined }
      }

      const testUrl = nodemailer.getTestMessageUrl(info)
      console.log('Message sent: %s', info.messageId)
      console.log('Preview URL: %s', testUrl)
      return { error: undefined, data: { ...info, testUrl } }
    })
  })
}

export const sendEmail = ({
  to,
  subject,
  body,
  html,
  displayName = '',
  cc,
  bcc,
  attachments,
}: {
  to: string
  subject?: string
  body?: string
  html?: string
  displayName?: string
  cc?: string
  bcc?: string
  attachments?: any
  _dangerousSendEmails?: boolean
}) => {
  let mailOptions = {
    from: `"${displayName}" <noreply@finitydevelopment.com>`, // sender address
    to: to, // list of receivers, comma delimted
    cc,
    bcc,
    attachments,
    subject: subject, // Subject line
    text: body, // plain text body
    html: html // html body
  }

  if (process.env.NODE_ENV !== 'production') return sendEmailTest(mailOptions)

  // If they have Office365 you can send from any email on that domain (it does not have to be a valid email account), heres how
  // 1. go to https://admin.exchange.microsoft.com/#/connectors
  // 2. Choose these settings, From: Your organization's email server, To: Office 365 then whitelist your IPs (this could be your dev enironment or production apps IPs)
  // 3. your all setup, no auth is required when whitelistsed just be careful who is whitelisted
  // 4. Use This Transport:
  // 	  const transporter = nodemailer.createTransport(
  // 	  	new SMTPTransport({
  // 	  		host: EMAIL_HOST // ex. "finitydevelopment-com.mail.protection.outlook.com",
  // 	  		port: 25,
  // 	  		secure: false
  // 	  	})
  // 	  )

  const transporter = nodemailer.createTransport(
    new SMTPTransport({
      host,
      port,
      auth,
      secure
    })
  )

  return transporter.sendMail(mailOptions, (error: Error | null, info: SentMessageInfo) => {
    if (error) {
      console.log('TCL: sendEmail -> error', error)
      return { error, data: undefined }
    }

    return { error: undefined, data: info }
  })
}
export const sendRegisterCode = function (email: string, code: string) {
  return sendEmail({
    to: email,
    html: `<div>Your verification code: <em style="color:red;">${code}</em> (valid for 20 minutes)</div>`
  });
};

