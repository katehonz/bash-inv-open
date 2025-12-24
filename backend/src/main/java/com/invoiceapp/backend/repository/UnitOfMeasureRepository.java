package com.invoiceapp.backend.repository;

import com.invoiceapp.backend.model.UnitOfMeasure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UnitOfMeasureRepository extends JpaRepository<UnitOfMeasure, String> {

    List<UnitOfMeasure> findByCategory(String category);

    List<UnitOfMeasure> findByCategoryOrderByName(String category);

    @Query("SELECT u FROM UnitOfMeasure u ORDER BY u.category, u.name")
    List<UnitOfMeasure> findAllOrderByCategoryAndName();

    @Query("SELECT u FROM UnitOfMeasure u WHERE " +
           "LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.nameEn) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.symbol) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.code) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "ORDER BY u.category, u.name")
    List<UnitOfMeasure> searchByNameOrCode(String search);

    @Query("SELECT u FROM UnitOfMeasure u WHERE " +
           "(LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.nameEn) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.symbol) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.code) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "u.category = :category " +
           "ORDER BY u.name")
    List<UnitOfMeasure> searchByNameOrCodeAndCategory(String search, String category);

    @Query("SELECT DISTINCT u.category FROM UnitOfMeasure u ORDER BY u.category")
    List<String> findAllCategories();
}
