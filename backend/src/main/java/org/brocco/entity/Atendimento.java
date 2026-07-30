package org.brocco.entity;

import org.brocco.enums.*;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "atendimentos")

public class Atendimento extends PanacheEntity {
    
    @Column(name = "admin_id", nullable = false)
    public Long adminId;

    public LocalDate data;
    public String hora;

    @Column(name = "cliente_novo")
    @Enumerated(EnumType.STRING)

    public SimNao clienteNovo = SimNao.NAO;

    public String nome, assunto, telefone, email;

    @Column(name = "data_proximo_contato")
    public LocalDate dataProximoContato;

    @Column(name = "como_conheceu")
    @Enumerated(EnumType.STRING)
    public ComoConheceu comoConheceu;

    @Column(name = "fechou_contrato")
    @Enumerated(EnumType.STRING)

    public SimNao fechouContrato = SimNao.NAO;

    @Column(name = "valor_consulta")
    public BigDecimal valorConsulta = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    public String observacoes;

    @Column(name = "google_event_id")
    public String googleEventId;

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