package org.brocco.dto.response;

import java.math.BigDecimal;
import java.time.*;
import org.brocco.enums.*;

public class AtendimentoResponse {
    public Long id;
    public LocalDate data;
    public String hora;
    public SimNao clienteNovo;
    public String nome, assunto, telefone, email;
    public LocalDate dataProximoContato;
    public ComoConheceu comoConheceu;
    public SimNao fechouContrato;
    public BigDecimal valorConsulta;
    public String observacoes, googleEventId;
    public LocalDateTime createdAt, updatedAt;
}
