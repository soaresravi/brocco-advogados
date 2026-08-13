package org.brocco.dto.response;

import java.time.*;
import org.brocco.enums.*;

public class TarefaResponse {
    public Long id;
    public String tarefa;
    public StatusTarefa status;
    public UrgenciaTarefa urgencia;
    public LocalDate prazo;
    public Long responsavelId;
    public String responsavelNome;
    public Long processoId;
    public String processoNumero;
    public Long clienteId;
    public String clienteNome, andamento;
    public LocalDateTime createdAt, updatedAt;
    public String googleEventId;
}