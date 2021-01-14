const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'ifeanyivalentine82@gmail.com',
    subject: 'Thanks for joining in',
    text: `Welcome to the app, ${name}. Let me know how you get along with the app.`,
  })
}

const deleteAccount = (email, name) => {
  sgMail.send({
    to: email,
    from: 'ifeanyivalentine82@gmail.com',
    subject: `${name}, We are sorry for the incovieniences, you might have experienced using our app. Kindly inform us about any issue that might led to the account deletion and we promise to make our services better`
  })
}

module.exports = {
  sendWelcomeEmail,
  deleteAccount
}