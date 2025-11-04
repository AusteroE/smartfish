import nodemailer from 'nodemailer';

const emailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
};

const transporter = nodemailer.createTransport(emailConfig);

export function generateVerificationToken(): string {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
}

export function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationEmail(
    email: string,
    username: string,
    token: string,
    otp: string
): Promise<boolean> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

    const mailOptions = {
        from: `"${process.env.FROM_NAME || 'Smart Fish Care System'}" <${process.env.FROM_EMAIL}>`,
        to: email,
        subject: 'Verify Your Email - Smart Fish Care',
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .otp-box { background-color: #fff; padding: 15px; border: 2px solid #4CAF50; border-radius: 5px; text-align: center; margin: 20px 0; }
          .otp-code { font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Smart Fish Care!</h1>
          </div>
          <div class="content">
            <p>Hello ${username},</p>
            <p>Thank you for signing up! Please verify your email address to complete your registration.</p>
            
            <div class="otp-box">
              <p>Your verification code is:</p>
              <div class="otp-code">${otp}</div>
              <p style="font-size: 12px; color: #666;">This code expires in 15 minutes</p>
            </div>
            
            <p>Or click the button below to verify your email:</p>
            <a href="${verificationUrl}" class="button">Verify Email</a>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            
            <p>If you didn't create an account, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Smart Fish Care System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Email sending failed:', error);
        return false;
    }
}

