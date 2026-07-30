package org.brocco.dto.response;

public class UserResponse {
    
    public Long id;
    public String nome, email, permissao, nomeEscritorio;

    public UserResponse() {}

    public UserResponse(Long id, String nome, String email, String permissao, String nomeEscritorio) {
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.permissao = permissao;
        this.nomeEscritorio = nomeEscritorio;
    }    
}
