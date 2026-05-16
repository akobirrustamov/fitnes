package com.example.backend.Repository;

import com.example.backend.Entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InvoiceRepo extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByMerchantTransId(String merchantTransId);

    Optional<Invoice> findByClickTransId(String clickTransId);

    boolean existsByClickTransIdAndStatusNot(String clickTransId, String status);
}

