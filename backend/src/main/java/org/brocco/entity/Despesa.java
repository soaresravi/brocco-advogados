package org.brocco.entity;

import org.brocco.enums.CategoriaDespesa;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "despesas")

public class Despesa extends PanacheEntity {
    
    @Column(name = "admin_id", nullable = false)
    public Long adminId;

    @Column(name = "data_prevista", nullable = false)
    public LocalDate dataPrevistaPagamento;

    @Column(name = "data_pagamento")
    public LocalDate dataEfetivaPagamento;

    @Column(nullable = false)
    public BigDecimal valor;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    
    public CategoriaDespesa categoria;

    @Column(nullable = false)
    public String despesa;

    @Column(name = "pago", nullable = false)
    public Boolean pago = false;

    @Column(columnDefinition = "TEXT")
    public String detalhes;

    @Column(name = "created_at")
    public LocalDateTime createdAt;

    @Column(name = "updated_at")
    public LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}