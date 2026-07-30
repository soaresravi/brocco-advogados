package org.brocco.dto.request;

import jakarta.validation.constraints.NotBlank;

public class AlterarSenhaRequest {
    
    @NotBlank(message = "Senha atual é obrigatória")
    public String senhaAtual;
    
    @NotBlank(message = "Nova senha é obrigatória")
    public String novaSenha;
    
    @NotBlank(message = "Confirmação de senha é obrigatória")
    public String confirmarSenha;
}
