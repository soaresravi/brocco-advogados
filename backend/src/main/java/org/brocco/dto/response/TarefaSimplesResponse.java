package org.brocco.dto.response;

import java.time.LocalDate;
import org.brocco.enums.*;

public class TarefaSimplesResponse {
    public Long id;
    public String tarefa;
    public StatusTarefa status;
    public UrgenciaTarefa urgencia;
    public LocalDate prazo;
    public String responsavelNome, clienteNome;
}