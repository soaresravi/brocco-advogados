package org.brocco.dto.response;

import java.math.BigDecimal;
import java.time.*;

import org.brocco.enums.CategoriaDespesa;

public class DespesaResponse {
    public Long id;
    public LocalDate dataPrevistaPagamento, dataEfetivaPagamento;
    public BigDecimal valor;
    public CategoriaDespesa categoria;
    public String despesa;
    public Boolean pago;
    public String detalhes;
    public LocalDateTime createdAt, updatedAt;
}