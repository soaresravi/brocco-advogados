package org.brocco.entity;

import org.brocco.enums.*;
import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.time.*;
import java.util.*;

@Entity
@Table(name = "providencias")

public class Providencia extends PanacheEntity {
    
    @Column(name = "admin_id", nullable = false)
    public Long adminId;

    @ManyToOne
    @JoinColumn(name = "cliente_id", nullable = false)

    public Cliente cliente;

    @Column(name = "data_atendimento", nullable = false)
    public LocalDate dataAtendimento;

    @Column(name = "status")
    @Enumerated(EnumType.STRING)

    public StatusProvidencia status = StatusProvidencia.PENDENTE;

    @ElementCollection
    @CollectionTable(name = "providencia_itens", joinColumns = @JoinColumn(name = "providencia_id"))
    @Column(name = "tipo")
    @Enumerated(EnumType.STRING)

    public List<TipoProvidencia> itens = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    public String observacoes;

    @Column(name = "enviar_para_id")
    public Long enviarParaId;

    @Column(name = "distribuir_para_id")
    public Long distribuirParaId;

    @OneToMany(mappedBy = "providencia", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<Anexo> anexos = new ArrayList<>();

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