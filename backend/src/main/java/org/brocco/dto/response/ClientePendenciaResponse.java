package org.brocco.dto.response;

public class ClientePendenciaResponse {
    
    public Long id;
    public String nome, matriculaSap, numeroProcesso, regimePrisional;
    public Long totalPendencias;

    public ClientePendenciaResponse() {}

    public ClientePendenciaResponse(Long id, String nome, String matriculaSap, String numeroProcesso, String regimePrisional, Long totalPendencias) {
        this.id = id;
        this.nome = nome;
        this.matriculaSap = matriculaSap;
        this.numeroProcesso = numeroProcesso;
        this.regimePrisional = regimePrisional;
        this.totalPendencias = totalPendencias;
    }
}