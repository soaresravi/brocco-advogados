package org.brocco.enums;

public enum TipoProcesso {
   
    CRIMINAL("Criminal"),
    DIVERSO("Diverso");

    private String descricao;

    TipoProcesso(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}