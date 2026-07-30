package org.brocco.dto.request;

import org.brocco.enums.TipoNotificacao;

public class NotificacaoRequest {
    public Long remetenteId;
    public TipoNotificacao tipo;
    public String titulo, mensagem;
    public Long entidadeId;
    public String entidadeTipo, link;   
}
