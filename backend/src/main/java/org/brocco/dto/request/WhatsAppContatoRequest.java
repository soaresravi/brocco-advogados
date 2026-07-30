package org.brocco.dto.request;

import java.time.LocalDate;
import jakarta.validation.constraints.*;

public class WhatsAppContatoRequest {
    
    @NotNull(message = "Data é obrigatória")
    public LocalDate dataContato;
    
    @NotBlank(message = "Nome é obrigatório")
    public String nome;
    
    @NotBlank(message = "Telefone é obrigatório")
    public String telefone;
    
    public String assunto;
}