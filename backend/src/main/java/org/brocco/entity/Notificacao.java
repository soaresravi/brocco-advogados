package org.brocco.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.time.LocalDateTime;

import org.brocco.enums.TipoNotificacao;

@Entity
@Table(name = "notificacoes")

public class Notificacao extends PanacheEntity {
    
    @Column(name = "usuario_id", nullable = false)
    public Long usuarioId;

    @Column(name = "remetente_id")
    public Long remetenteId;

    @Column(name = "tipo", nullable = false)
    @Enumerated(EnumType.STRING)
    public TipoNotificacao tipo;

    @Column(nullable = false, columnDefinition = "TEXT")
    public String titulo;

    @Column(columnDefinition = "TEXT")
    public String mensagem;

    @Column(name = "lida", nullable = false)
    public boolean lida = false;

    @Column(name = "entidade_id")
    public Long entidadeId;

    @Column(name = "entidade_tipo")
    public String entidadeTipo;

    @Column(name = "link")
    public String link;

    @Column(name = "created_at")
    public LocalDateTime createdAt;

    @PrePersist
    
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }
}