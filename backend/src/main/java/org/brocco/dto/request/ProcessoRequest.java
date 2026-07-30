package org.brocco.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import org.brocco.enums.SituacaoProcesso;
import java.util.List;

public class ProcessoRequest {
    
    public Long clienteId;
    public String numeroProcesso;
    public SituacaoProcesso situacao;
    public Boolean prazoEmAberto;
    public LocalDate dataPrazo, lapsoProgressao;
    public BigDecimal honorarios;

    public List<MovimentacaoRequest> movimentacoes;
}
