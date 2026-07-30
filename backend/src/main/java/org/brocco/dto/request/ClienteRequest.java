package org.brocco.dto.request;

import org.brocco.enums.*;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import java.util.List;

public class ClienteRequest {
    
    @NotBlank(message = "Nome é obrigatório")
    public String nome;
    
    public String cpf, matriculaSap;
    public RegimePrisional regimePrisional;
    public String sexo;
    public LocalDate dataNascimento;
    public UnidadePrisional unidadePrisional;
    public String numeroProcesso;
    public ReuStatus reuStatus;
    public String crimesAcaoPenal;
    public ComoConheceu comoConheceu;
    public String observacoes;

    public List<ContratanteRequest> contratantes;
}
