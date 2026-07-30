package org.brocco.dto.request;

import java.time.LocalDate;
import jakarta.validation.constraints.NotNull;
import org.brocco.enums.StatusEvento;

public class AudienciaRequest {
    
    @NotNull(message = "Data é obrigatória")
    public LocalDate data;
    
    @NotNull(message = "Hora é obrigatória")
    public String hora;
    
    public StatusEvento status;
    
    @NotNull(message = "Processo é obrigatório")
    public Long processoId;
    
    public String detalhes, local, observacoes;
}
