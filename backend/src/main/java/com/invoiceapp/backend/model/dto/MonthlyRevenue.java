package com.invoiceapp.backend.model.dto;

public class MonthlyRevenue {
    private String month;
    private Double revenue;

    public MonthlyRevenue() {}

    public MonthlyRevenue(String month, Double revenue) {
        this.month = month;
        this.revenue = revenue;
    }

    // Getters and Setters
    public String getMonth() {
        return month;
    }

    public void setMonth(String month) {
        this.month = month;
    }

    public Double getRevenue() {
        return revenue;
    }

    public void setRevenue(Double revenue) {
        this.revenue = revenue;
    }
}