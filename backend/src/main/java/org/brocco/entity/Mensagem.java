package org.brocco.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "mensagens")

public class Mensagem extends PanacheEntity {
    
    @Column(name = "remetente_id", nullable = false)
    public Long remetenteId;

    @Column(name = "destinatario_id", nullable = false)
    public Long destinatarioId;

    @Column(nullable = false, columnDefinition = "LONGTEXT")
    public String conteudo;

    @Column(name = "lida", nullable = false)
    public boolean lida = false;

    @Column(name = "created_at")
    public LocalDateTime createdAt;

    @PrePersist

    public void prePersist() {
        createdAt = LocalDateTime.now();
    }
}