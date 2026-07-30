package org.brocco.entity;

import org.brocco.enums.TipoRecebimento;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "recebimentos")

public class Recebimento extends PanacheEntity {
    
    @Column(name = "admin_id", nullable = false)
    public Long adminId;

    @Column(name = "data_prevista_recebimento", nullable = false)
    public LocalDate dataPrevistaRecebimento;

    @Column(name = "data_recebimento")
    public LocalDate dataRecebimento;

    @Column(nullable = false)
    public BigDecimal valor;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    public TipoRecebimento tipo;

    
}
