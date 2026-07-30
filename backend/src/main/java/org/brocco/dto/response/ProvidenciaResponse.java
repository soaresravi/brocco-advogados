package org.brocco.dto.response;

import java.time.*;
import org.brocco.enums.*;
import java.util.List;

public class ProvidenciaResponse {
    public Long id, clienteId;
    public String clienteNome, clienteMatriculaSap;
    public LocalDate dataAtendimento;
    public StatusProvidencia status;
    public List<TipoProvidencia> itens;
    public String observacoes;
    public Long enviarParaId;
    public String enviarParaNome;
    public Long distribuirParaId;
    public String distribuirParaNome;
    public LocalDateTime createdAt, updatedAt;
}