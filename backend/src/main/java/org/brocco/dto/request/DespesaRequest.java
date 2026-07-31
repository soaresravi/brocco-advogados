package org.brocco.dto.request;

import org.brocco.enums.CategoriaDespesa;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public class DespesaRequest {
    
    @NotNull(message = "Data prevista é obrigatória")
    public LocalDate dataPrevistaPagamento;
    
    public LocalDate dataEfetivaPagamento;
    
    @NotNull(message = "Valor é obrigatório")
    @Positive(message = "Valor deve ser positivo")
   
    public BigDecimal valor;
    
    @NotNull(message = "Categoria é obrigatória")
    public CategoriaDespesa categoria;
    
    @NotBlank(message = "Descrição é obrigatória")
    public String despesa;
    
    public Boolean pago = false;
    public String detalhes;    
}