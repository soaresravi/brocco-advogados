package org.brocco.dto.response;

import java.time.LocalDateTime;

import org.brocco.enums.TipoNotificacao;

public class NotificacaoResponse {
    public Long id, remetenteId;
    public String remetenteNome;
    public TipoNotificacao tipo;
    public String titulo, mensagem;
    public boolean lida;
    public Long entidadeId;
    public String entidadeTipo, link;
    public LocalDateTime createdAt;
}