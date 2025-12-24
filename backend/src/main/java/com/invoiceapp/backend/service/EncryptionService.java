package com.invoiceapp.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class EncryptionService {

    private static final Logger logger = LoggerFactory.getLogger(EncryptionService.class);
    
    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 16;

    @Value("${app.encryption.key:YourDefaultEncryptionKeyHere123456789012}")
    private String encryptionKey;

    /**
     * Криптира текст използвайки AES-256-GCM
     */
    public String encrypt(String plainText) {
        try {
            SecretKey secretKey = getSecretKey();
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            
            // Генерираме случаен IV
            byte[] iv = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(iv);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv);
            
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, gcmSpec);
            
            byte[] encryptedData = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
            
            // Комбинираме IV + encrypted data
            byte[] encryptedWithIv = new byte[GCM_IV_LENGTH + encryptedData.length];
            System.arraycopy(iv, 0, encryptedWithIv, 0, GCM_IV_LENGTH);
            System.arraycopy(encryptedData, 0, encryptedWithIv, GCM_IV_LENGTH, encryptedData.length);
            
            return Base64.getEncoder().encodeToString(encryptedWithIv);
            
        } catch (Exception e) {
            logger.error("Failed to encrypt data", e);
            throw new RuntimeException("Encryption failed", e);
        }
    }

    /**
     * Дешифрира текст използвайки AES-256-GCM
     */
    public String decrypt(String encryptedText) {
        try {
            SecretKey secretKey = getSecretKey();
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            
            byte[] encryptedWithIv = Base64.getDecoder().decode(encryptedText);
            
            // Извличаме IV и encrypted data
            byte[] iv = new byte[GCM_IV_LENGTH];
            byte[] encryptedData = new byte[encryptedWithIv.length - GCM_IV_LENGTH];
            
            System.arraycopy(encryptedWithIv, 0, iv, 0, GCM_IV_LENGTH);
            System.arraycopy(encryptedWithIv, GCM_IV_LENGTH, encryptedData, 0, encryptedData.length);
            
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, gcmSpec);
            
            byte[] decryptedData = cipher.doFinal(encryptedData);
            
            return new String(decryptedData, StandardCharsets.UTF_8);
            
        } catch (Exception e) {
            logger.error("Failed to decrypt data", e);
            throw new RuntimeException("Decryption failed", e);
        }
    }

    /**
     * Генерира нов encryption key (за инициализация)
     */
    public String generateNewKey() {
        try {
            KeyGenerator keyGenerator = KeyGenerator.getInstance(ALGORITHM);
            keyGenerator.init(256); // AES-256
            SecretKey secretKey = keyGenerator.generateKey();
            return Base64.getEncoder().encodeToString(secretKey.getEncoded());
        } catch (Exception e) {
            logger.error("Failed to generate new encryption key", e);
            throw new RuntimeException("Key generation failed", e);
        }
    }

    /**
     * Валидира дали encryption key е правилен
     */
    public boolean isValidKey(String key) {
        try {
            byte[] keyBytes = Base64.getDecoder().decode(key);
            return keyBytes.length == 32; // 256 bits = 32 bytes
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Тества encryption/decryption с тестов текст
     */
    public boolean testEncryption() {
        try {
            String testText = "Test encryption";
            String encrypted = encrypt(testText);
            String decrypted = decrypt(encrypted);
            
            boolean success = testText.equals(decrypted);
            if (success) {
                logger.info("Encryption test passed");
            } else {
                logger.error("Encryption test failed - decrypted text doesn't match original");
            }
            return success;
            
        } catch (Exception e) {
            logger.error("Encryption test failed with exception", e);
            return false;
        }
    }

    /**
     * Получава SecretKey от конфигурацията
     */
    private SecretKey getSecretKey() {
        try {
            // Ако ключът е по-кратък от 32 bytes, го padding-ваме
            String key = encryptionKey;
            if (key.length() < 32) {
                key = String.format("%-32s", key).replace(' ', '0');
            } else if (key.length() > 32) {
                key = key.substring(0, 32);
            }
            
            byte[] keyBytes = key.getBytes(StandardCharsets.UTF_8);
            return new SecretKeySpec(keyBytes, ALGORITHM);
            
        } catch (Exception e) {
            logger.error("Failed to create secret key", e);
            throw new RuntimeException("Failed to create secret key", e);
        }
    }

    /**
     * Проверява дали encryption service е правилно конфигуриран
     */
    public boolean isConfigured() {
        try {
            return encryptionKey != null && 
                   !encryptionKey.trim().isEmpty() && 
                   !encryptionKey.equals("YourDefaultEncryptionKeyHere123456789012") &&
                   testEncryption();
        } catch (Exception e) {
            logger.error("Encryption service configuration check failed", e);
            return false;
        }
    }

    /**
     * Получава информация за encryption конфигурацията
     */
    public EncryptionInfo getEncryptionInfo() {
        return new EncryptionInfo(
            ALGORITHM + "/" + TRANSFORMATION.split("/")[1] + "/" + TRANSFORMATION.split("/")[2],
            isConfigured(),
            encryptionKey != null && !encryptionKey.equals("YourDefaultEncryptionKeyHere123456789012")
        );
    }

    /**
     * Клас с информация за encryption конфигурацията
     */
    public static class EncryptionInfo {
        private final String algorithm;
        private final boolean configured;
        private final boolean customKey;

        public EncryptionInfo(String algorithm, boolean configured, boolean customKey) {
            this.algorithm = algorithm;
            this.configured = configured;
            this.customKey = customKey;
        }

        public String getAlgorithm() {
            return algorithm;
        }

        public boolean isConfigured() {
            return configured;
        }

        public boolean isCustomKey() {
            return customKey;
        }

        @Override
        public String toString() {
            return String.format("EncryptionInfo{algorithm='%s', configured=%s, customKey=%s}", 
                               algorithm, configured, customKey);
        }
    }
}