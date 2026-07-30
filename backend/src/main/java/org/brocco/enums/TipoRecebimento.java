package org.brocco.enums;

public enum TipoRecebimento {
    
    COMISSAO("Comissão"),
    CONSULTA("Consulta"),
    ENTRADA("Entrada"),
    HONORARIOS("Honorários"),
    MENSALIDADE("Mensalidade"),
    MULTA("Multa"),
    OUTROS("Outros");

    private String descricao;

    TipoRecebimento(String descricao) {
        this.descricao = descricao;
    }
    
    public String getDescricao() {
        return descricao;
    }
}
