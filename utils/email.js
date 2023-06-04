const nodemailer = require('nodemailer');
const Mailgen = require('mailgen');
const pug = require('pug');
const htmlToText = require('html-to-text');

class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Subhasish Kabi <${process.env.EMAIL_FROM}>`;
  }

  // 1) Method 1 => Creating the transport

  newTransport() {
    //this is not built in

    if (process.env.NODE_ENV === 'production') {
// 2) Using real mail

      return nodemailer.createTransport({
        service: 'Gmail',
        //port: 587,
        auth: {
          user: process.env.EMAIL_USERNAME2,
          pass: process.env.EMAIL_PASSWORD2,
        },
      });


    }

    return nodemailer.createTransport({
      //create transport is built in
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // 2) Method 2 => send the actual email
  async send(template, subject) {
    // 1) Render HTML based on pug template. We will just create a html. we will not send this to client. so render function will not be used here

    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        filename: this.firstName,
        url: this.url,
        subject,
      }
    );

    const text = htmlToText.htmlToText(html);
    // 2) Define mail options

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject, //subject:subject,
      html, //html: html,
      text,
    };

    // 3) creating a transport

    await this.newTransport().sendMail(mailOptions);

    //await transporter.sendMail(mailOptions)
  }

  // 3) which type of mail

  async sendWelcome() {
    await this.send('Welcome', 'Welcome to natours family');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token(Valid only for 10 mins)'
    );
  }
}

module.exports = Email;

/*



//////////////---------------------------USING MAILTRAP------------------------------------------------///////////////////////



//{ email: user.email,subject: 'Your Password reset token (VALID FOR 10 mins)',message } //this the options object sent as an argument
const sendEmail = async (options) => { //
  //1) Create a transporter

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  // 2) Define mail options

  let mailOptions = {
    from: 'Subhasish Kabi <skabi36@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: '<b>Hello World</b>',
  };

  let info = await transporter.sendMail(mailOptions);
  //console.log(info)
};



module.exports =  sendEmail 









//-------------------------------------------USING GMAIL-------------------------------------------------------///


// const sendEmail = async (options) => {
 

// const transporter = nodemailer.createTransport({
//   service: "Gmail",
//   //port: 587,
//   auth: {
//     user: process.env.EMAIL_USERNAME,
//     pass: process.env.EMAIL_PASSWORD,
//   },
// });


// let mailOptions = {
//   from: process.env.EMAIL_USERNAME,
//   to: options.email,
//   subject: "Testing",
//   text: options.message,

// };

// await transporter.sendMail(mailOptions)

// }



*/
