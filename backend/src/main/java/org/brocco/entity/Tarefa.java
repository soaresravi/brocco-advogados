package org.brocco.entity;

import org.brocco.enums.*;
import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.time.*;

@Entity
@Table(name = "tarefas")

public class Tarefa extends PanacheEntity {
    
    @Column(name = "admin_id", nullable = false)
    public Long adminId;

    @Column(name = "google_event_id")
    public String googleEventId;

    @Column(columnDefinition = "TEXT")
    public String tarefa;

    @Column(name = "status")
    @Enumerated(EnumType.STRING)

    public StatusTarefa status = StatusTarefa.NAO_INICIADA;

    @Column(name = "urgencia")
    @Enumerated(EnumType.STRING)

    public UrgenciaTarefa urgencia;

    public LocalDate prazo;

    @Column(name = "responsavel_id")
    public Long responsavelId;

    @Column(name = "processo_id")
    public Long processoId;

    @Column(name = "processo_numero")
    public String processoNumero;

    @Column(name = "cliente_id")
    public Long clienteId;

    @Column(name = "cliente_nome")
    public String clienteNome;

    @Column(columnDefinition = "TEXT")
    public String andamento;

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