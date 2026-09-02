package org.brocco.dto.response;

import java.math.BigDecimal;
import java.time.*;
import org.brocco.enums.*;
import java.util.List;

public class ProcessoResponse {
    public Long id, clienteId;
    public String clienteNome, matriculaSap;
    public RegimePrisional regimePrisional;
    public String numeroProcesso;
    public SituacaoProcesso situacao;
    public Boolean prazoEmAberto;
    public LocalDate dataPrazo, lapsoProgressao;
    public Long diasRestantesLapso;
    public Boolean lapsoProximo;
    public BigDecimal honorarios;
    public List<MovimentacaoResponse> movimentacoes;
    public LocalDateTime createdAt, updatedAt;
    public TipoProcesso tipoProcesso;
    public Qualificacao qualificacao;
    public String comarca, varaOrgaoJulgador, areaJuridica, observacoes;
}
