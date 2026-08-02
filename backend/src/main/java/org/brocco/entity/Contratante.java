package org.brocco.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "contratantes")

public class Contratante extends PanacheEntity {
    
    @ManyToOne
    @JsonIgnore
    @JoinColumn(name = "cliente_id", nullable = false)

    public Cliente cliente;

    @Column(nullable = false)
    public String nome;

    @Column(nullable = false)
    public String telefone;

    @Column(name = "grau_parentesco")
    public String grauParentesco;
}
