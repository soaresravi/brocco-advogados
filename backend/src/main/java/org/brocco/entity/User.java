package org.brocco.entity;

import org.brocco.enums.Permissao;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "usuarios")

public class User extends PanacheEntity {
    
    @Column(nullable = false)
    public String nome;

    @Column(nullable = false, unique = true)
    public String email;

    @Column(nullable = false)
    public String senha;

    @Column(name = "nome_escritorio")
    public String nomeEscritorio;

    @Column(name = "admin_id")
    public Long adminId;

    @Column(name = "permissao", nullable = false)
    @Enumerated(EnumType.STRING)

    public Permissao permissao = Permissao.READ;

    @Column(name = "google_refresh_token", columnDefinition = "TEXT")
    public String googleRefreshToken;

    @Column(name = "google_email")
    public String googleEmail;

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

    public boolean isAdmin() {
        return this.permissao == Permissao.ADMIN;
    }

    public boolean canEdit() {
        return this.permissao == Permissao.ADMIN || this.permissao == Permissao.EDIT;
    }
}