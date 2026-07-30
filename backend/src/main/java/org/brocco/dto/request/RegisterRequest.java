package org.brocco.dto.request;

import jakarta.validation.constraints.*;

public class RegisterRequest {
    
    @NotBlank(message = "Nome é obrigatório")
    public String nome;
    
    @NotBlank(message = "Email é obrigatório")
    @Email(message = "Email inválido")
  
    public String email;
    
    @NotBlank(message = "Senha é obrigatória")
    @Size(min = 6, message = "Senha deve ter pelo menos 6 caracteres")
    
    public String senha;
    
    @NotBlank(message = "Nome do escritório é obrigatório")
    public String nomeEscritorio;
}
