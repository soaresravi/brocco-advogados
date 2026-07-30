package org.brocco.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.brocco.enums.StatusEvento;

public class AudienciaResponse {
    public Long id;
    public LocalDate data;
    public String hora;
    public StatusEvento status;
    public Long processoId;
    public String processoNumero, detalhes, local, observacoes;
    public Long diasAteEvento;
    public String googleEventId;
    public LocalDateTime createdAt, updatedAt;
}
