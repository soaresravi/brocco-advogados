package org.brocco.dto.response;

import java.time.*;
import org.brocco.enums.*;
import java.util.List;

public class ClienteResponse {
    public Long id;
    public String nome, cpf, matriculaSap;
    public RegimePrisional regimePrisional;
    public String sexo;
    public LocalDate dataNascimento;
    public UnidadePrisional unidadePrisional;
    public String numeroProcesso;
    public ReuStatus reuStatus;
    public String crimesAcaoPenal;
    public ComoConheceu comoConheceu;
    public String observacoes;
    public List<ContratanteResponse> contratantes;
    public LocalDateTime createdAt, updatedAt;
}
