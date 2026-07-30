package org.brocco.dto.request;

import java.time.LocalDate;
import jakarta.validation.constraints.*;

public class MovimentacaoRequest {
    
    @NotNull(message = "Data é obrigatória")
    public LocalDate data;
    
    @NotBlank(message = "Descrição é obrigatória")
    public String descricao;
}
