package org.brocco.enums;

public enum SituacaoProcesso {
    
    ATIVO("Ativo"),
    INATIVO("Inativo");

    private String descricao;

    SituacaoProcesso(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
