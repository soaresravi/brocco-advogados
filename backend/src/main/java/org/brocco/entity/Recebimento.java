package org.brocco.entity;

import org.brocco.enums.TipoRecebimento;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "recebimentos")

public class Recebimento extends PanacheEntity {
    
    @Column(name = "admin_id", nullable = false)
    public Long adminId;

    @Column(name = "data_prevista", nullable = false)
    public LocalDate dataPrevistaRecebimento;

    @Column(name = "data_recebimento")
    public LocalDate dataRecebimento;

    @Column(nullable = false)
    public BigDecimal valor;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
   
    public TipoRecebimento tipo;

    @Column(name = "recebido", nullable = false)
    public Boolean recebido = false;

    public String parcela;

    @Column(name = "processo_id")
    public Long processoId;

    @Column(name = "processo_numero")
    public String processoNumero;

    @Column(name = "cliente_id")
    public Long clienteId;

    @Column(name = "cliente_nome")
    public String clienteNome;

    @Column(columnDefinition = "LONGTEXT")
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