package org.brocco.enums;

public enum UrgenciaTarefa {
    
    EXIGE_ATENCAO_IMEDIATA("Exige atenção imediata"),
    MUITO_URGENTE("Muito urgente"),
    REQUER_ATENCAO("Requer atenção"),
    POUCO_URGENTE("Pouco urgente"),
    PODE_ESPERAR("Pode esperar");

    private String descricao;

    UrgenciaTarefa(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
