package org.brocco.dto.request;

import org.brocco.enums.*;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;

public class ProvidenciaRequest {

    @NotNull(message = "Cliente é obrigatório")
    public Long clienteId;

    @NotNull(message = "Data do atendimento é obrigatória")
    public LocalDate dataAtendimento;

    public StatusProvidencia status = StatusProvidencia.PENDENTE;
    public List<TipoProvidencia> itens;
    public String observacoes;
    public Long enviarParaId, distribuirParaId;
}