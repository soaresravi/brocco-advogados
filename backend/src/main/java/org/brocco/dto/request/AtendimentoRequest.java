package org.brocco.dto.request;

import org.brocco.enums.*;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public class AtendimentoRequest {
    
    @NotNull(message = "Data é obrigatória")
    public LocalDate data;

    @NotNull(message = "Hora é obrigatória")
    public String hora;

    public SimNao clienteNovo = SimNao.NAO;

    @NotBlank(message = "Nome é obrigatório")
    public String nome;
    
    public String assunto, telefone, email;
    public LocalDate dataProximoContato;
    public ComoConheceu comoConheceu;
    public SimNao fechouContrato = SimNao.NAO;
    public BigDecimal valorConsulta = BigDecimal.ZERO;
    public String observacoes;
}