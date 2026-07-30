package org.brocco.dto.request;

import jakarta.validation.constraints.NotBlank;

public class ContratanteRequest {
    
    @NotBlank(message = "Nome do contratante é obrigatório")
    public String nome;
    
    @NotBlank(message = "Telefone do contratante é obrigatório")
    public String telefone;
    
    public String grauParentesco;
}
