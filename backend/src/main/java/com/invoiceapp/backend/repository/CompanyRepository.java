package com.invoiceapp.backend.repository;

import com.invoiceapp.backend.model.Company;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import org.springframework.stereotype.Repository;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {

    @Override
    @EntityGraph(attributePaths = {"users"})
    List<Company> findAll();
}
