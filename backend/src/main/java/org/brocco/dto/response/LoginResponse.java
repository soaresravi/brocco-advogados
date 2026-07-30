package org.brocco.dto.response;

public class LoginResponse {
    
    public String token;
    public Long id;
    public String nome, email, permissao, nomeEscritorio;

    public LoginResponse() {}

    public LoginResponse(String token, Long id, String nome, String email, String permissao, String nomeEscritorio) {
        this.token = token;
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.permissao = permissao;
        this.nomeEscritorio = nomeEscritorio;
    }
}
