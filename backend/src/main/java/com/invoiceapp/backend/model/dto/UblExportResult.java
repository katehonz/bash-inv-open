package com.invoiceapp.backend.model.dto;

import java.util.List;

/**
 * DTO за резултат от UBL XML експорт
 */
public class UblExportResult {
    private boolean success;
    private String xml;
    private String filename;
    private String message;
    private List<String> validationErrors;

    public UblExportResult() {}

    public UblExportResult(boolean success, String xml, String filename, String message) {
        this.success = success;
        this.xml = xml;
        this.filename = filename;
        this.message = message;
    }

    public static UblExportResult success(String xml, String filename) {
        return new UblExportResult(true, xml, filename, "UBL XML експортиран успешно");
    }

    public static UblExportResult error(String message) {
        return new UblExportResult(false, null, null, message);
    }

    public static UblExportResult error(String message, List<String> validationErrors) {
        UblExportResult result = new UblExportResult(false, null, null, message);
        result.setValidationErrors(validationErrors);
        return result;
    }

    // Getters and Setters
    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getXml() {
        return xml;
    }

    public void setXml(String xml) {
        this.xml = xml;
    }

    public String getFilename() {
        return filename;
    }

    public void setFilename(String filename) {
        this.filename = filename;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public List<String> getValidationErrors() {
        return validationErrors;
    }

    public void setValidationErrors(List<String> validationErrors) {
        this.validationErrors = validationErrors;
    }
}
