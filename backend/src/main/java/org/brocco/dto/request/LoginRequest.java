package org.brocco.dto.request;

import jakarta.validation.constraints.*;

public class LoginRequest {
    
    @NotBlank(message = "Email é obrigatório")
    @Email(message = "Email inválido")
    
    public String email;
    
    @NotBlank(message = "Senha é obrigatória")
    public String senha;
}
