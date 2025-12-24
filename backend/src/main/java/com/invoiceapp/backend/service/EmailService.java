package com.invoiceapp.backend.service;

import com.invoiceapp.backend.model.SmtpSettings;
import com.invoiceapp.backend.repository.SmtpSettingsRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.util.Properties;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final SmtpSettingsRepository smtpSettingsRepository;
    private final EncryptionService encryptionService;

    @Value("${app.frontend-url:https://inv.cyberbuch.org}")
    private String frontendUrl;

    @Autowired
    public EmailService(SmtpSettingsRepository smtpSettingsRepository, EncryptionService encryptionService) {
        this.smtpSettingsRepository = smtpSettingsRepository;
        this.encryptionService = encryptionService;
    }

    /**
     * Изпраща обикновен текстов имейл
     */
    public boolean sendSimpleEmail(String to, String subject, String content) {
        try {
            SmtpSettings settings = getActiveSmtpSettings();
            if (settings == null) {
                logger.error("No active SMTP settings found");
                return false;
            }

            JavaMailSender mailSender = createMailSender(settings);
            SimpleMailMessage message = new SimpleMailMessage();
            
            message.setFrom(settings.getFromEmail());
            message.setTo(to);
            message.setSubject(subject);
            message.setText(content);

            mailSender.send(message);
            logger.info("Simple email sent successfully to: {}", to);
            return true;

        } catch (Exception e) {
            logger.error("Failed to send simple email to: {}", to, e);
            return false;
        }
    }

    /**
     * Изпраща HTML имейл
     */
    public boolean sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            SmtpSettings settings = getActiveSmtpSettings();
            if (settings == null) {
                logger.error("No active SMTP settings found");
                return false;
            }

            JavaMailSender mailSender = createMailSender(settings);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(settings.getFromEmail(), settings.getFromName());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true); // true = HTML content

            mailSender.send(message);
            logger.info("HTML email sent successfully to: {}", to);
            return true;

        } catch (Exception e) {
            logger.error("Failed to send HTML email to: {}", to, e);
            return false;
        }
    }

    /**
     * Изпраща password reset имейл
     */
    public boolean sendPasswordResetEmail(String to, String resetToken, String userDisplayName) {
        try {
            String subject = "Възстановяване на парола - Invoice App";
            String resetUrl = buildPasswordResetUrl(resetToken);
            
            String htmlContent = buildPasswordResetEmailContent(userDisplayName, resetUrl, resetToken);
            
            return sendHtmlEmail(to, subject, htmlContent);

        } catch (Exception e) {
            logger.error("Failed to send password reset email to: {}", to, e);
            return false;
        }
    }

    /**
     * Изпраща документ по имейл с прикачен PDF
     */
    public boolean sendDocumentEmail(String to, String subject, String htmlContent, byte[] pdfData, String pdfFilename) {
        try {
            SmtpSettings settings = getActiveSmtpSettings();
            if (settings == null) {
                logger.error("No active SMTP settings found");
                return false;
            }

            JavaMailSender mailSender = createMailSender(settings);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(settings.getFromEmail(), settings.getFromName());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            // Прикачване на PDF
            helper.addAttachment(pdfFilename, new jakarta.mail.util.ByteArrayDataSource(pdfData, "application/pdf"));

            mailSender.send(message);
            logger.info("Document email sent successfully to: {} with attachment: {}", to, pdfFilename);
            return true;

        } catch (Exception e) {
            logger.error("Failed to send document email to: {}", to, e);
            return false;
        }
    }

    /**
     * Изпраща документ по имейл с PDF и UBL XML прикачени файлове
     * За интеграция с ERP системи
     */
    public boolean sendDocumentEmailWithUbl(String to, String subject, String htmlContent,
                                             byte[] pdfData, String pdfFilename,
                                             String ublXml, String ublFilename) {
        try {
            SmtpSettings settings = getActiveSmtpSettings();
            if (settings == null) {
                logger.error("No active SMTP settings found");
                return false;
            }

            JavaMailSender mailSender = createMailSender(settings);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(settings.getFromEmail(), settings.getFromName());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            // Прикачване на PDF
            helper.addAttachment(pdfFilename, new jakarta.mail.util.ByteArrayDataSource(pdfData, "application/pdf"));

            // Прикачване на UBL XML
            if (ublXml != null && ublFilename != null) {
                byte[] ublData = ublXml.getBytes(java.nio.charset.StandardCharsets.UTF_8);
                helper.addAttachment(ublFilename, new jakarta.mail.util.ByteArrayDataSource(ublData, "application/xml"));
            }

            mailSender.send(message);
            logger.info("Document email sent successfully to: {} with attachments: {}, {}", to, pdfFilename, ublFilename);
            return true;

        } catch (Exception e) {
            logger.error("Failed to send document email with UBL to: {}", to, e);
            return false;
        }
    }

    /**
     * Тества SMTP настройките
     */
    public SmtpTestResult testSmtpSettings(SmtpSettings settings) {
        try {
            JavaMailSender testMailSender = createMailSender(settings);
            
            // Създаваме тестов имейл
            SimpleMailMessage testMessage = new SimpleMailMessage();
            testMessage.setFrom(settings.getFromEmail());
            testMessage.setTo(settings.getFromEmail()); // Изпращаме на себе си
            testMessage.setSubject("SMTP Test - Invoice App");
            testMessage.setText("This is a test email to verify SMTP settings configuration.");

            // Опитваме се да изпратим
            testMailSender.send(testMessage);
            
            // Обновяваме settings с успешен тест
            settings.setLastTestedAt(LocalDateTime.now());
            settings.setTestResult("SUCCESS");
            smtpSettingsRepository.save(settings);
            
            logger.info("SMTP test successful for settings: {}", settings.getDisplayName());
            return new SmtpTestResult(true, "SMTP connection successful");

        } catch (Exception e) {
            logger.error("SMTP test failed for settings: {}", settings.getDisplayName(), e);
            
            // Обновяваме settings с неуспешен тест
            settings.setLastTestedAt(LocalDateTime.now());
            settings.setTestResult("FAILED: " + e.getMessage());
            smtpSettingsRepository.save(settings);
            
            return new SmtpTestResult(false, "SMTP connection failed: " + e.getMessage());
        }
    }

    /**
     * Получава активните SMTP настройки
     */
    private SmtpSettings getActiveSmtpSettings() {
        return smtpSettingsRepository.findActiveSettings().orElse(null);
    }

    /**
     * Създава JavaMailSender от SMTP настройки
     */
    private JavaMailSender createMailSender(SmtpSettings settings) {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        
        mailSender.setHost(settings.getSmtpHost());
        mailSender.setPort(settings.getSmtpPort());
        mailSender.setUsername(settings.getSmtpUsername());
        
        // Дешифрираме паролата
        String decryptedPassword = encryptionService.decrypt(settings.getSmtpPassword());
        mailSender.setPassword(decryptedPassword);

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", settings.getSmtpAuth().toString());
        props.put("mail.smtp.starttls.enable", settings.getUseTls().toString());
        props.put("mail.smtp.ssl.enable", settings.getUseSsl().toString());
        
        // Timeout настройки
        props.put("mail.smtp.connectiontimeout", "10000"); // 10 seconds
        props.put("mail.smtp.timeout", "10000");
        props.put("mail.smtp.writetimeout", "10000");
        
        // Debug настройка (само в development)
        props.put("mail.debug", "false");

        return mailSender;
    }

    /**
     * Построява URL за reset на парола
     */
    private String buildPasswordResetUrl(String token) {
        return frontendUrl + "/reset-password?token=" + token;
    }

    /**
     * Построява HTML съдържанието на password reset имейла
     */
    private String buildPasswordResetEmailContent(String userDisplayName, String resetUrl, String token) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Възстановяване на парола</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .button { display: inline-block; background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
                    .footer { padding: 20px; font-size: 12px; color: #666; text-align: center; }
                    .warning { background-color: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 15px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Възстановяване на парола</h1>
                    </div>
                    <div class="content">
                        <h2>Здравейте, %s!</h2>
                        <p>Получихме заявка за възстановяване на паролата за вашия акаунт в Invoice App.</p>
                        <p>За да продължите с възстановяването, моля кликнете на бутона по-долу:</p>
                        <p style="text-align: center;">
                            <a href="%s" class="button">Възстанови парола</a>
                        </p>
                        <p>Или копирайте и поставете следния линк в браузъра си:</p>
                        <p style="word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 4px;">%s</p>
                        <div class="warning">
                            <strong>Важно:</strong> Този линк е валиден само 1 час от получаването на този имейл.
                        </div>
                        <p>Ако не сте заявили възстановяване на парола, моля игнорирайте този имейл.</p>
                        <hr>
                        <p><small>Код за референция: %s</small></p>
                    </div>
                    <div class="footer">
                        <p>© 2024 Invoice App. Всички права запазени.</p>
                        <p>Този имейл е изпратен автоматично. Моля, не отговаряйте.</p>
                    </div>
                </div>
            </body>
            </html>
            """, userDisplayName, resetUrl, resetUrl, token.substring(0, 8) + "...");
    }

    /**
     * Клас за резултат от SMTP тест
     */
    public static class SmtpTestResult {
        private final boolean success;
        private final String message;

        public SmtpTestResult(boolean success, String message) {
            this.success = success;
            this.message = message;
        }

        public boolean isSuccess() {
            return success;
        }

        public String getMessage() {
            return message;
        }
    }
}