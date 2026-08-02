package org.brocco.dto.response;

import java.time.LocalDate;

public class AgendaDiariaResponse {
    public LocalDate data;
    public String diaSemana;
    public long prazos, audiencias, atendimentos, andamentos, tarefas;
}