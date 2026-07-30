package org.brocco.enums;

public enum CategoriaDespesa {
    
    AGUA("Água"),
    ALIMENTACAO("Alimentação"),
    ALUGUEL("Aluguel"),
    CELULAR("Celular"),
    COMPRAS("Compras"),
    GAS("Gás"),
    INTERNET("Internet"),
    INVESTIMENTO("Investimento"),
    LIMPEZA("Limpeza"),
    LUZ("Luz"),
    MANUTENCAO("Manutenção"),
    MATERIAIS("Materiais"),
    MERCADO("Mercado"),
    OUTRAS("Outras"),
    OUTRAS_DESPESAS_FUNCIONARIO("Outras despesas com funcionário"),
    PUBLICIDADE("Publicidade"),
    SALARIO_FUNCIONARIO("Salário de funcionário"),
    TRANSPORTE("Transporte");

    private String descricao;

    CategoriaDespesa(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}