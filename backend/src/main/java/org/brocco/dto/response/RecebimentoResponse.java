package org.brocco.dto.response;

import org.brocco.enums.TipoRecebimento;

import java.math.BigDecimal;
import java.time.*;

public class RecebimentoResponse {
    public Long id;
    public LocalDate dataPrevistaRecebimento, dataRecebimento;
    public BigDecimal valor;
    public TipoRecebimento tipo;
    public Boolean recebido;
    public String parcela;
    public Long processoId;
    public String processoNumero;
    public Long clienteId;
    public String clienteNome, detalhes;
    public LocalDateTime createdAt, updatedAt;
}