package org.brocco.entity;

import org.brocco.enums.*;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.time.*;
import java.util.*;

@Entity
@Table(name = "clientes")

public class Cliente extends PanacheEntity {
    
    @Column(name = "admin_id", nullable = false)
    public Long adminId;

    @Column(nullable = false)
    public String nome;

    public String cpf;

    @Column(name = "matricula_sap")
    public String matriculaSap;

    @Column(name = "regime_prisional")
    @Enumerated(EnumType.STRING)

    public RegimePrisional regimePrisional;

    public String sexo;

    @Column(name = "data_nascimento")
    public LocalDate dataNascimento;

    @Column(name = "unidade_prisional")
    @Enumerated(EnumType.STRING)

    public UnidadePrisional unidadePrisional;

    @Column(name = "numero_processo")
    public String numeroProcesso;

    @Column(name = "reu_status")
    @Enumerated(EnumType.STRING)
    
    public ReuStatus reuStatus;

    @Column(name = "crimes_acao_penal", columnDefinition = "LONGTEXT")
    public String crimesAcaoPenal;

    @Column(name = "como_conheceu")
    @Enumerated(EnumType.STRING)

    public ComoConheceu comoConheceu;

    @Column(columnDefinition = "TEXT")
    public String observacoes;

    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<Contratante> contratantes = new ArrayList<>();

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
