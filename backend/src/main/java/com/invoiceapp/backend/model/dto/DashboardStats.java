package com.invoiceapp.backend.model.dto;

import java.util.List;

public class DashboardStats {
    private Integer totalClients;
    private Integer totalInvoices;
    private Double totalRevenue;
    private Integer pendingInvoices;
    private Integer overduedInvoices;
    private List<RecentInvoice> recentInvoices;
    private List<MonthlyRevenue> monthlyRevenue;

    public DashboardStats() {}

    public DashboardStats(Integer totalClients, Integer totalInvoices, Double totalRevenue, 
                         Integer pendingInvoices, Integer overduedInvoices, 
                         List<RecentInvoice> recentInvoices, List<MonthlyRevenue> monthlyRevenue) {
        this.totalClients = totalClients;
        this.totalInvoices = totalInvoices;
        this.totalRevenue = totalRevenue;
        this.pendingInvoices = pendingInvoices;
        this.overduedInvoices = overduedInvoices;
        this.recentInvoices = recentInvoices;
        this.monthlyRevenue = monthlyRevenue;
    }

    // Getters and Setters
    public Integer getTotalClients() {
        return totalClients;
    }

    public void setTotalClients(Integer totalClients) {
        this.totalClients = totalClients;
    }

    public Integer getTotalInvoices() {
        return totalInvoices;
    }

    public void setTotalInvoices(Integer totalInvoices) {
        this.totalInvoices = totalInvoices;
    }

    public Double getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(Double totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public Integer getPendingInvoices() {
        return pendingInvoices;
    }

    public void setPendingInvoices(Integer pendingInvoices) {
        this.pendingInvoices = pendingInvoices;
    }

    public Integer getOverduedInvoices() {
        return overduedInvoices;
    }

    public void setOverduedInvoices(Integer overduedInvoices) {
        this.overduedInvoices = overduedInvoices;
    }

    public List<RecentInvoice> getRecentInvoices() {
        return recentInvoices;
    }

    public void setRecentInvoices(List<RecentInvoice> recentInvoices) {
        this.recentInvoices = recentInvoices;
    }

    public List<MonthlyRevenue> getMonthlyRevenue() {
        return monthlyRevenue;
    }

    public void setMonthlyRevenue(List<MonthlyRevenue> monthlyRevenue) {
        this.monthlyRevenue = monthlyRevenue;
    }
}