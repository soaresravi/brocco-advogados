package org.brocco.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class WhatsAppContatoResponse {
    public Long id;
    public LocalDate dataContato;
    public String nome, telefone, assunto;
    public LocalDateTime createdAt, updatedAt;
}