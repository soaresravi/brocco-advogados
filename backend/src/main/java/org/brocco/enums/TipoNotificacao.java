package org.brocco.enums;

public enum TipoNotificacao {
    
    ALERTA("Alerta"),
    MENSAGEM("Mensagem"),
    TAREFA_PENDENTE("Tarefa Pendente"),
    PROVIDENCIA("Providência"),
    LAPSO_PROGRESSAO("Lapso de Progressão"),
    PENDENCIA_ADMINISTRATIVA("Pendência Administrativa"),
    PENDENCIA_FINANCEIRA("Pendência Financeira"),
    OBSERVACAO("Observação");

    private String descricao;

    TipoNotificacao(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }

}