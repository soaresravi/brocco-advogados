package org.brocco.entity;

import org.brocco.enums.StatusEvento;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.time.*;
import java.time.temporal.ChronoUnit;

@Entity
@Table(name = "audiencias")

public class Audiencia extends PanacheEntity {
    
    @Column(name = "admin_id", nullable = false)
    public Long adminId;

    public LocalDate data;
    public String hora;

    @Enumerated(EnumType.STRING)
    public StatusEvento status;

    @Column(name = "processo_id")
    public Long processoId;

    @Column(name = "processo_numero")
    public String processoNumero;

    public String detalhes, local, observacoes;

    @Column(name = "microsoft_event_id")
    public String microsoftEventId;

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

    public Long getDiasAteEvento() {
        if (data == null) return null;
        return ChronoUnit.DAYS.between(LocalDate.now(), data);
    }
}