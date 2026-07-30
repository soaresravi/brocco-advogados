package org.brocco.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "atividades_log")

public class AtividadeLog extends PanacheEntity {
    
    @Column(nullable = false)
    public Long userId;

    @Column(nullable = false)
    public String acao;

    @Column(nullable = false)
    public String entidade;

    public Long entidadeId;

    @Column(length = 1000)
    public String descricao;

    public String ip, userAgent;

    @Column(nullable = false)
    public LocalDateTime createdAt;

    @PrePersist
    
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }
}