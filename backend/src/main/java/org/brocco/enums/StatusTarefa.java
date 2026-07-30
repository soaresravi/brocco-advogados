package org.brocco.enums;

public enum StatusTarefa {
   
    NAO_INICIADA("Não iniciada"),
    EM_ANDAMENTO("Em andamento"),
    CONCLUIDA("Concluída");

    private String descricao;

    StatusTarefa(String descricao) {
        this.descricao = descricao;
    }
   
    public String getDescricao() {
        return descricao;
    }
}
