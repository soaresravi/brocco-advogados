package org.brocco.enums;

public enum ComoConheceu {
   
    ANUNCIO("Anúncio"),
    FAMILIA_AMIGO("É família/Amigo"),
    GOOGLE("Google"),
    INDICACAO("Indicação"),
    OUTROS("Outros"),
    PARCERIA("Parceria"),
    REDES_SOCIAIS("Redes sociais"),
    SITE("Site");

    private String descricao;

    ComoConheceu(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
