package org.brocco.dto.request;

import jakarta.validation.constraints.*;

public class CreateUserRequest {
    
    @NotBlank(message = "Nome é obrigatório")
    public String nome;
    
    @NotBlank(message = "Email é obrigatório")
    @Email(message = "Email inválido")
    
    public String email;
    
    @NotBlank(message = "Senha é obrigatória")
    @Size(min = 6, message = "Senha deve ter pelo menos 6 caracteres")
    
    public String senha;
    
    @NotNull(message = "Permissão é obrigatória")
    public String permissao;
}
