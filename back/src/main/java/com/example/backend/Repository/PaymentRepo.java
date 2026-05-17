package com.example.backend.Repository;

import com.example.backend.Entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;

public interface PaymentRepo extends JpaRepository<Payment, Long> {

    @Query(value = """
            SELECT COALESCE(SUM(CASE WHEN p.payment_type = 'income' THEN COALESCE(p.amount, p.price, 0) ELSE 0 END), 0)
            FROM payments p
            JOIN persons pr ON pr.id = p.person_id
            WHERE p.organization_id = :orgId
              AND pr.trainer_id = :trainerId
              AND p.payment_date >= date_trunc('month', CURRENT_TIMESTAMP)
              AND p.payment_date < date_trunc('month', CURRENT_TIMESTAMP) + INTERVAL '1 month'
            """, nativeQuery = true)
    BigDecimal sumIncomeThisMonthByTrainer(@Param("orgId") Integer orgId,
                                          @Param("trainerId") Long trainerId);
}

