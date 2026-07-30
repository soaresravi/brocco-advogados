package org.brocco.dto.response;

import java.time.*;
import org.brocco.enums.*;
import java.util.List;

public class ProvidenciaAndamentoResponse {
    public Long id;
    public LocalDate dataAtendimento;
    public StatusProvidencia status;
    public List<TipoProvidencia> itens;
    public String observacoes, enviarParaNome, distribuirParaNome;
    public LocalDateTime createdAt, updatedAt;
}