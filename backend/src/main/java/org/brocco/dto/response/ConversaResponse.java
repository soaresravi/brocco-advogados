package org.brocco.dto.response;

import java.time.LocalDateTime;

public class ConversaResponse {
    public Long usuarioId;
    public String usuarioNome, ultimaMensagem;
    public LocalDateTime ultimaData;
    public long naoLidas;   
}