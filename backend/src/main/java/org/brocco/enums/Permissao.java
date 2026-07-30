package org.brocco.enums;

public enum Permissao {
    
    ADMIN("Administrador"),
    EDIT("Edição"),
    READ("Leitura");

    private String descricao;

    Permissao(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }   
}
