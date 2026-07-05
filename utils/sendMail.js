const dns = require("dns");
const nodemailer = require("nodemailer");

dns.setDefaultResultOrder("ipv4first");

const forceIpv4Lookup = (hostname, options, callback) => {
  dns.lookup(hostname, { ...options, family: 4 }, callback);
};

const sendMail = async (to, subject, html, text) => {
  const user = (process.env.EMAIL_USER || "")
    .replace(/^['\"]|['\"]$/g, "")
    .trim();
  const pass = (process.env.EMAIL_PASS || "")
    .replace(/^['\"]|['\"]$/g, "")
    .trim();

  if (!user || !pass) {
    throw new Error("EMAIL_USER and EMAIL_PASS must be set in production");
  }

  console.log("MAILER_MODE=ipv4-gmail", { to, subject });

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    family: 4,
    lookup: forceIpv4Lookup,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    auth: {
      user,
      pass,
    },
  });

  await transporter.sendMail({
    from: `"EmployeeMS" <${user}>`,
    to,
    subject,
    html,
    text,
  });
};

module.exports = sendMail;
