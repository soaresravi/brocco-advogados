package org.brocco.dto.response;

public class UsuarioSimplesResponse {
    
    public Long id;
    public String nome, email, permissao;

    public UsuarioSimplesResponse() {}

    public UsuarioSimplesResponse(Long id, String nome, String email, String permissao) {
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.permissao = permissao;
    }   
}
