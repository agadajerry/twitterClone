import nodemailer from 'nodemailer';

let transporter: any;
const sendEmail = async (email: string, subject: string, message: string) => {
  //1. create a transporter
  if (process.env.NODE_ENV === 'development') {
    transporter = nodemailer.createTransport({
      host: 'smtp.mailtrap.io',
      port: 2525,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      logger: true,
    });
  } else {
    transporter = nodemailer.createTransport({
      host: 'smtp-mail.outlook.com',
      port: 587,
      auth: {
        user: process.env.OUTLOOK_USERNAME,
        pass: process.env.OUTLOOK_PASSWORD,
      },
    });
    //Activate in gmail "less secure app" option
  }

  //2. define the email options

  const mailOptions = {
    from: 'thetwiteeapp@outlook.com',
    to: email,
    subject: subject,
    html: message,
  };

  transporter.sendMail(mailOptions, function (error: any) {
    if (error) {
      console.log(error.message, '>>>>');
    } else {
      console.log('Message Sent>>>');
    }
  });
};
export default sendEmail;

// import nodemailer from 'nodemailer';
// const sendEmail = async (email: string, subject: string, message: string) => {
//   console.log(process.env.GMAIL_USER, process.env.GMAIL_PASS);
//   // console.log(process.env.GMAIL_USER, process.env.GMAIL_PASS);
//   console.log('chidera testing email');

//   let transporter = nodemailer.createTransport({
//     // service: 'gmail',
//     host: 'smtp.gmail.com',
//     secure: true,
//     port: 465,
//     auth: {
//       user: `tweetgp123@gmail.com`,
//       pass: `twitterDB123`,
//       // user: `${process.env.GMAIL_USER}`,
//       // pass: `${process.env.GMAIL_PASS}`,
//     },
//   });

//   let mailOptions = {
//     from: `${process.env.GMAIL_USER}`,
//     to: email,
//     subject: subject,
//     html: message,
//   };

//   transporter.sendMail(mailOptions, function (err, info) {
//     if (err) {
//       console.log(err);
//       return err;
//     } else {
//       console.log(info);
//       return info;
//     }
//   });
// };

// export default sendEmail;
