package org.brocco.dto.request;

import org.brocco.enums.TipoRecebimento;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public class RecebimentoRequest {
    
    @NotNull(message = "Data prevista é obrigatória")
    public LocalDate dataPrevistaRecebimento;
    
    public LocalDate dataRecebimento;
    
    @NotNull(message = "Valor é obrigatório")
    @Positive(message = "Valor deve ser positivo")
    
    public BigDecimal valor;
    
    @NotNull(message = "Tipo é obrigatório")
    public TipoRecebimento tipo;
    
    public Boolean recebido = false;
    public String parcela;
    public Long processoId;
    public String processoNumero;
    public Long clienteId;
    public String clienteNome, detalhes;
}