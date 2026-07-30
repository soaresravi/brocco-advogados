package org.brocco.dto.response;

import java.time.LocalDateTime;

public class MensagemResponse {
    public Long id, remetenteId;
    public String remetenteNome;
    public Long destinatarioId;
    public String destinatarioNome, conteudo;
    public boolean lida;
    public LocalDateTime createdAt;
}