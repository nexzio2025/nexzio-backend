// Load ENV
require("dotenv").config();

// Packages
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// App
const app = express();
app.set("trust proxy", 1);


// =========================
// SECURITY
// =========================

// Helmet
app.use(helmet());

// Rate Limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 10 // limit each IP
});

app.use(limiter);


// =========================
// MIDDLEWARE
// =========================

app.use(cors());

app.use(express.json());


// =========================
// ENV VALIDATION
// =========================

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {

  console.error("❌ Missing EMAIL_USER or EMAIL_PASS");

  process.exit(1);

}

console.log("📧 Email configured:", process.env.EMAIL_USER);


// =========================
// MAIL TRANSPORTER
// =========================

const transporter = nodemailer.createTransport({

//  service: "gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
  
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000

});


// =========================
// VERIFY EMAIL SERVER
// =========================

transporter.verify((err) => {

  if (err) {

    console.error("❌ Email error:", err);

  } else {

    console.log("✅ Email server ready");

  }

});


// =========================
// HOME ROUTE
// =========================

app.get("/", (req, res) => {

  res.send("🚀 Nexzio server is running");

});


// =========================
// CONTACT ROUTE
// =========================

app.post("/contact", async (req, res) => {

  try {

    console.log("📥 Request:", req.body);

    const {
      name,
      email,
      phone,
      message
    } = req.body;


    // =========================
    // VALIDATION
    // =========================

    if (
      !name?.trim() ||
      !email?.trim() ||
      !phone?.trim() ||
      !message?.trim()
    ) {

      return res.json({
        success: false,
        error: "All fields are required"
      });

    }


    // =========================
    // EMAIL VALIDATION
    // =========================

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {

      return res.json({
        success: false,
        error: "Invalid email address"
      });

    }


    // =========================
    // SEND ADMIN EMAIL
    // =========================

    const info = await transporter.sendMail({

      from: `"Nexzio" <${process.env.EMAIL_USER}>`,

      to: "nexzioservices@gmail.com",

      cc: process.env.EMAIL_USER,

      subject: `New message from ${name}`,

      html: `
        <div style="font-family:sans-serif;padding:20px;">
        
          <h2>📩 New Contact Message</h2>

          <p><b>Name:</b> ${name}</p>

          <p><b>Email:</b> ${email}</p>

          <p><b>Phone:</b> ${phone}</p>

          <p><b>Message:</b></p>

          <p>${message}</p>

        </div>
      `

    });

    console.log("✅ Email sent:", info.response);


    // =========================
    // AUTO REPLY
    // =========================

    await transporter.sendMail({

      from: `"Nexzio" <${process.env.EMAIL_USER}>`,

      to: email,

      subject: "We received your message",

      text: `Hi ${name},

Thanks for contacting Nexzio.

We received your message and our team will contact you shortly.

- Nexzio`

    });

    console.log("📤 Auto reply sent");


    // =========================
    // SUCCESS RESPONSE
    // =========================

    res.json({
      success: true
    });

  } catch (err) {

    console.error("❌ Error:", err);

    res.json({
      success: false,
      error: err.message
    });

  }

});


// =========================
// START SERVER
// =========================

const PORT = process.env.PORT || 8082;

app.listen(PORT, () => {

  console.log(`🚀 Server running at http://localhost:${PORT}`);

});
