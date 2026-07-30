package org.brocco.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

import org.brocco.enums.RegimePrisional;
import org.brocco.enums.SituacaoProcesso;

@Entity
@Table(name = "processos")

public class Processo extends PanacheEntity {
    
    @Column(name = "admin_id", nullable = false)
    public Long adminId;

    @ManyToOne
    @JoinColumn(name = "cliente_id")

    public Cliente cliente;

    @Column(name = "numero_processo")
    public String numeroProcesso;

    @Column(name = "situacao")
    @Enumerated(EnumType.STRING)

    public SituacaoProcesso situacao;

    @Column(name = "matricula_sap")
    public String matriculaSap;

    @Column(name = "regime_prisional")
    @Enumerated(EnumType.STRING)

    public RegimePrisional regimePrisional;

    @Column(name = "prazo_em_aberto")
    public Boolean prazoEmAberto;

    @Column(name = "data_prazo")
    public LocalDate dataPrazo;

    @Column(name = "lapso_progressao")
    public LocalDate lapsoProgressao;

    public BigDecimal honorarios;

    @OneToMany(mappedBy = "processo", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<Movimentacao> movimentacoes = new ArrayList<>();

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

    public boolean isLapsoProximo() {
        if (lapsoProgressao == null) return false;
        LocalDate hoje = LocalDate.now();
        return java.time.temporal.ChronoUnit.DAYS.between(hoje, lapsoProgressao) <= 60;
    }

    public Long getDiasRestantesLapso() {
        if (lapsoProgressao == null) return null;
        LocalDate hoje = LocalDate.now();
        return java.time.temporal.ChronoUnit.DAYS.between(hoje, lapsoProgressao);
    }
}
