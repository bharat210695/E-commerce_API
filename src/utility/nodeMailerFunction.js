const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp-mail.outlook.com",
  secureConnection: false, // TLS requires secureConnection to be false
  port: 587, // port for secure SMTP
  tls: {
    // ciphers: "SSLv3",
    rejectUnauthorized: false,
  },
  auth: {
    user: "contactpritam2@gmail.com",
    pass: "yijbyggzdrufkgfz",
  },
});

const sendOtpMail = (email, otp) => {
  return new Promise((resolve, reject) => {
    try {
      const mailOptions = {
        from: "contactpritam2@gmail.com",
        to: email,
        subject: "Otp for email verification",
        html: `<h3>Dear ${email}</h3><p>You have requested to verify your email. For verify successfully, follow the OTP bellow for verification</p><p>OTP : <b>${otp}</b></p><p>This Email is subject to mandatory instruction.</p><p>Thanks,</p><p>All Codes</p>`,
      };
      transporter
        .sendMail(mailOptions)
        .then(() => {
          return resolve(`OTP has been Sent to ${email}`);
        })
        .catch((error) => {
          if (error) {
            console.log("send otp error", error.response);
            return reject({
              message: "Failed to send OTP ",
            });
          }
        });
    } catch (error) {
      return reject(error.message);
    }
  });
};

const sendForgotPasswordMail = async (email, otp) => {
  return new Promise((resolve, reject) => {
    try {
      const mailOptions = {
        from: "contactpritam2@gmail.com",
        to: email,
        subject: "Otp for password reset",
        html: `<h3>Dear ${email}</h3><p>You have requested to change password. For verify successfully, follow the OTP bellow for password reset</p><p>OTP : <b>${otp}</b></p><p>This Email is subject to mandatory instruction.</p><p>Thanks,</p><p>All Codes</p>`,
      };
      transporter
        .sendMail(mailOptions)
        .then(() => {
          return resolve(`OTP has been Sent to ${email}`);
        })
        .catch((error) => {
          if (error) {
            console.log("send otp error", error.response);
            return reject({
              message: "Failed to send OTP ",
            });
          }
        });
    } catch (error) {
      return reject(error.message);
    }
  });
};

const sendCronjobFailureMail = async (email, message, subscriptionId) => {
  return new Promise((resolve, reject) => {
    try {
      const mailOptions = {
        from: "contactpritam2@gmail.com",
        to: email,
        subject: "Failed to Expire Vendor Subscription!",
        html: `<h3>Dear ${email}</h3><p>One of the Subscription(${subscriptionId}) was supposed to expire now. But the operation has failed due to "${message}". Contact Your Technical Team to Deal with this Issue. </p><p>Thanks,</p><p>All Codes</p>`,
      };
      transporter
        .sendMail(mailOptions)
        .then(() => {
          return resolve(`Message has been sent to ${email}`);
        })
        .catch((error) => {
          if (error) {
            console.log("Message Send Error!", error.response);
            return reject({
              message: "Failed to send Message!",
            });
          }
        });
    } catch (error) {
      return reject(error.message);
    }
  });
};
const sendCronjobSuccessMail = async (email, subscriptionId) => {
  return new Promise((resolve, reject) => {
    try {
      const mailOptions = {
        from: "contactpritam2@gmail.com",
        to: email,
        subject: "Subscription Expired!",
        html: `<h3>Dear ${email}</h3><p>One of the Subscription(${subscriptionId}) which was supposed to expire Today has expired. Your products are no longer listed in our premium collections.</p><p>Thanks,</p><p>All Codes</p>`,
      };
      transporter
        .sendMail(mailOptions)
        .then(() => {
          return resolve(`Message has been sent to ${email}`);
        })
        .catch((error) => {
          if (error) {
            console.log("Message Send Error!", error.response);
            return reject({
              message: "Failed to send Message!",
            });
          }
        });
    } catch (error) {
      return reject(error.message);
    }
  });
};

const sendOtpSms = async (number, otp) => {
  const from = "WEM Website";
  const to = "917240598589";
  const text = "A text message sent using the Vonage SMS API";

  vonage.message.sendSms(from, to, text, (err, responseData) => {
    if (err) {
      console.log(err);
      return { status: false, message: err };
    } else {
      if (responseData.messages[0]["status"] === "0") {
        console.log("Message sent successfully.");
        return { status: true, message: "Message sent successfully." };
      } else {
        console.log(
          `Message failed with error: ${responseData.messages[0]["error-text"]}`
        );
        return {
          status: false,
          message: `Message failed with error: ${responseData.messages[0]["error-text"]}`,
        };
      }
    }
  });
};

module.exports = {
  sendOtpMail,
  sendForgotPasswordMail,
  sendOtpSms,
  sendCronjobFailureMail,
  sendCronjobSuccessMail,
};
