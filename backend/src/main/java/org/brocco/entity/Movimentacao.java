package org.brocco.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "movimentacoes")

public class Movimentacao extends PanacheEntity {
    
    @ManyToOne
    @JoinColumn(name = "processo_id", nullable = false)

    public Processo processo;

    @Column(nullable = false)
    public LocalDate data;

    @Column(columnDefinition = "TEXT")
    public String descricao;
}
