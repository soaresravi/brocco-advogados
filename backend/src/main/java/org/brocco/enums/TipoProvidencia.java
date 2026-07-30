package org.brocco.enums;

public enum TipoProvidencia {
    
    HABILITACAO_REVOGACAO("Habilitação/Revogação"),
    ATESTADOS_TRABALHO("Atestados de Trabalho"),
    ATESTADOS_ESTUDOS("Atestados de Estudos"),
    CURSOS("Cursos"),
    ENCCEJA("ENCCEJA"),
    ENEM("ENEM"),
    LEITURA("Leitura"),
    DETRACAO("Detração"),
    COMUTACAO("Comutação"),
    INDULTO("Indulto"),
    APROXIMACAO_FAMILIAR("Aproximação familiar");

    private String descricao;

    TipoProvidencia(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}