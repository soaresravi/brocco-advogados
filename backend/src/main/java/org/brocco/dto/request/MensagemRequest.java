package org.brocco.dto.request;

import jakarta.validation.constraints.*;

public class MensagemRequest {
    @NotNull(message = "Destinatário é obrigatório")
    public Long destinatarioId;
    
    @NotBlank(message = "Conteúdo é obrigatório")
    public String conteudo;   
}