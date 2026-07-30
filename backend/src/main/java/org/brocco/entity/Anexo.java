package org.brocco.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "anexos")

public class Anexo extends PanacheEntity {
    
    @Column(nullable = false, unique = true)
    public String uuid;

    @Column(name = "cliente_id", nullable = false)
    public Long clienteId;

    @Column(nullable = false)
    public String nome;

    public String tipo;
    public Long tamanho;
    public String url;

    @Column(name = "admin_id", nullable = false)
    public Long adminId;

    @ManyToOne
    @JoinColumn(name = "providencia_id")
    
    public Providencia providencia;

    @Column(name = "uploaded_at")
    public LocalDateTime uploadedAt;

    @PrePersist

    public void prePersist() {
        uploadedAt = LocalDateTime.now();
    }
}