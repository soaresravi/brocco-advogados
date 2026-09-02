package org.brocco.enums;

public enum Qualificacao {

    ACUSADO("Acusado"),
    ACUSANTE("Acusante"),
    ADOTADO("Adotado"),
    ADOTANTE("Adotante"),
    AGRAVADO("Agravado"),
    AGRAVANTE("Agravante"),
    APELADO("Apelado"),
    APELANTE("Apelante"),
    AUTOR("Autor"),
    COMUNICADO("Comunicado"),
    COMUNICANTE("Comunicante"),
    CORRIGENTE("Corrigente"),
    CORRIGIDO("Corrigido"),
    EMBARGADO("Embargado"),
    EMBARGANTE("Embargante"),
    EXCEPTO("Excepto"),
    EXCIPIENTE("Excipiente"),
    EXECUTADO("Executado"),
    EXECUTANTE("Executante"),
    EXPROPRIADO("Expropriado"),
    EXPROPRIANTE("Expropriante"),
    IMPETRADO("Impetrado"),
    IMPETRANTE("Impetrante"),
    IMPUGNADO("Impugnado"),
    IMPUGNANTE("Impugnante"),
    INTERPELADO("Interpelado"),
    INTERPELANTE("Interpelante"),
    INVENTARIADO("Inventariado"),
    INVENTARIANTE("Inventariante"),
    NOTICIADO("Noticiado"),
    NOTICIANTE("Noticiante"),
    NOTIFICADO("Notificado"),
    NOTIFICANTE("Notificante"),
    NUNCIADO("Nunciado"),
    NUNCIANTE("Nunciante"),
    OFENDIDO("Ofendido"),
    OFENSOR("Ofensor"),
    OPOENTE("Opoente"),
    OPOSTO("Oposto"),
    QUERELADO("Querelado"),
    QUERELANTE("Querelante"),
    RECLAMADO("Reclamado"),
    RECLAMANTE("Reclamante"),
    RECORRENTE("Recorrente"),
    RECORRIDO("Recorrido"),
    REPRESENTADO("Representado"),
    REPRESENTANTE("Representante"),
    REQUERENTE("Requerente"),
    REQUERIDO("Requerido"),
    REU("Réu"),
    SUSCITADO("Suscitado"),
    SUSCITANTE("Suscitante");

    private String descricao;

    Qualificacao(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}