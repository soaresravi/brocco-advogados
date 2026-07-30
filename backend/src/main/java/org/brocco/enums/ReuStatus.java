package org.brocco.enums;

public enum ReuStatus {
    
    PRIMARIO("Primário"),
    REINCIDENTE("Reincidente");

    private String descricao;

    ReuStatus(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
