package com.invoiceapp.backend.model.dto;

/**
 * DTO за резултат от изтриване на клиент
 */
public class DeleteClientResult {
    private final boolean success;
    private final String message;
    
    public DeleteClientResult(boolean success, String message) {
        this.success = success;
        this.message = message;
    }
    
    public boolean isSuccess() {
        return success;
    }
    
    public String getMessage() {
        return message;
    }
    
    public static DeleteClientResult success() {
        return new DeleteClientResult(true, "Клиентът беше изтрит успешно");
    }
    
    public static DeleteClientResult error(String message) {
        return new DeleteClientResult(false, message);
    }
}
