package org.brocco.enums;

public enum RegimePrisional {
    
    FECHADO("Fechado"),
    SEMIABERTO("Semiaberto"),
    ABERTO("Aberto"),
    LIVRAMENTO_CONDICIONAL("Livramento condicional"),
    DOMICILIAR("Domiciliar"),
    AGUARDANDO("Aguardando");

    private String descricao;

    RegimePrisional(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
