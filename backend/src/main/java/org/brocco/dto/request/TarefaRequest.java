package org.brocco.dto.request;

import java.time.LocalDate;
import org.brocco.enums.*;

public class TarefaRequest {
    public String tarefa;
    public StatusTarefa status = StatusTarefa.NAO_INICIADA;
    public UrgenciaTarefa urgencia;
    public LocalDate prazo;
    public Long responsavelId, processoId;
    public String processoNumero;
    public Long clienteId;
    public String clienteNome, andamento;
}