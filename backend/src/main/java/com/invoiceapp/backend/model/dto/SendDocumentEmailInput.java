package com.invoiceapp.backend.model.dto;

public class SendDocumentEmailInput {
    private Long documentId;
    private String recipientEmail;
    private String pdfBase64;
    private Boolean includeUblXml;  // Ако е true, прикачва и UBL XML за ERP интеграция

    public Long getDocumentId() {
        return documentId;
    }

    public void setDocumentId(Long documentId) {
        this.documentId = documentId;
    }

    public String getRecipientEmail() {
        return recipientEmail;
    }

    public void setRecipientEmail(String recipientEmail) {
        this.recipientEmail = recipientEmail;
    }

    public String getPdfBase64() {
        return pdfBase64;
    }

    public void setPdfBase64(String pdfBase64) {
        this.pdfBase64 = pdfBase64;
    }

    public Boolean getIncludeUblXml() {
        return includeUblXml;
    }

    public void setIncludeUblXml(Boolean includeUblXml) {
        this.includeUblXml = includeUblXml;
    }
}
