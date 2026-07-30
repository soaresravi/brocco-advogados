package org.brocco.enums;

public enum SimNao {
    
    SIM("Sim"),
    NAO("Não");

    private String descricao;

    SimNao(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
