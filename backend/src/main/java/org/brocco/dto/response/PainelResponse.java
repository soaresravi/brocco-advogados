package org.brocco.dto.response;

import java.util.*;

public class PainelResponse {
    
    public String dataHora, fuso;
    public long processosAtivos, audienciasAgendadas, clientesCadastrados;
    public Map<String, List<TarefaSimplesResponse>> tarefasDoDia;
    public long totalTarefasHoje;
    public List<AgendaDiariaResponse> agendaProximos7Dias;
    public long prazosHoje, providenciasPendentes, recebimentosAtraso, despesasAtraso;
}