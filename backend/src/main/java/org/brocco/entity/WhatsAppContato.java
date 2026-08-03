package org.brocco.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.time.*;

@Entity
@Table(name = "whatsapp_contatos")

public class WhatsAppContato extends PanacheEntity {
    
    @Column(name = "admin_id", nullable = false)
    public Long adminId;

    @Column(name = "data_contato", nullable = false)
    public LocalDate dataContato;

    @Column(nullable = false)
    public String nome;

    @Column(nullable = false)
    public String telefone;

    @Column(columnDefinition = "LONGTEXT")
    public String assunto;

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