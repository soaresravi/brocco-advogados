package org.brocco.resource;

import org.brocco.dto.request.*;
import org.brocco.dto.response.*;
import org.brocco.entity.*;
import org.brocco.enums.*;
import org.brocco.service.*;
import org.brocco.util.ErroResponse;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;

import org.eclipse.microprofile.jwt.JsonWebToken;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Path("/processos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed("USER")

public class ProcessoResource {
    
    @Inject
    JsonWebToken jwt;

    @Inject
    AtividadeLogService logService;

    @Context
    UriInfo uriInfo;

    @Context
    HttpHeaders httpHeaders;

    private Long getUserId() {
        return Long.parseLong(jwt.getSubject());
    }

    private String getUserAgent() {
        return httpHeaders.getHeaderString("User-Agent");
    }

    private String getClientIp() {

        String ip = httpHeaders.getHeaderString("X-Forwarded-For");

        if (ip != null && !ip.isEmpty()) {
            return ip.split(",")[0].trim();
        }

        ip = httpHeaders.getHeaderString("X-Real-IP");

        if (ip != null && !ip.isEmpty()) {
            return ip;
        }

        return null;

    }

    private Long getAdminId() {
        User currentUser = User.findById(getUserId());
        return currentUser.adminId != null ? currentUser.adminId : currentUser.id;
    }

    private boolean canEdit() {
        User user = User.findById(getUserId());
        return user.permissao == Permissao.ADMIN || user.permissao == Permissao.EDIT;
    }

    @GET

    public Response listar(@QueryParam("page") @DefaultValue("0") int page, @QueryParam("size") @DefaultValue("10") int size, @QueryParam("search") String search, @QueryParam("situacao") String situacao, @QueryParam("regime") String regime, @QueryParam("prazoEmAberto") Boolean prazoEmberto) {

        Long adminId = getAdminId();

        StringBuilder query = new StringBuilder("adminId = ?1");
        List<Object> params = new java.util.ArrayList<>();

        params.add(adminId);

        if (search != null && !search.isEmpty()) {
            query.append(" and (numeroProcesso like ?").append(params.size() + 1);
            params.add("%" + search + "%");
            query.append(" or matriculaSap like ?").append(params.size() + 1);
            params.add("%" + search + "%");
            query.append(" or cliente.nome like ?").append(params.size() + 1);
            params.add("%" + search + "%");
            query.append(")");
        }

        if (situacao != null && !situacao.isEmpty()) {
            
            try {
                SituacaoProcesso situacaoEnum = SituacaoProcesso.valueOf(situacao.toUpperCase());
                query.append(" AND situacao = ?").append(params.size() + 1);
                params.add(situacaoEnum);
            } catch (IllegalArgumentException e) {
                System.out.println("error");
            }

        }

        if (regime != null && !regime.isEmpty()) {
            
            try {
                RegimePrisional regimeEnum = RegimePrisional.valueOf(regime.toUpperCase());
                query.append(" AND regimePrisional = ?").append(params.size() + 1);
                params.add(regimeEnum);
            } catch (IllegalArgumentException e) {
                System.out.println("error");
            }
            
        }

        if (prazoEmberto != null) {
            query.append(" and prazoEmAberto = ?").append(params.size() + 1);
            params.add(prazoEmberto);
        }

        query.append(" order by id desc");
        long total = Processo.find(query.toString(), params.toArray()).count();

        List<Processo> processos = Processo.find(query.toString(), params.toArray()).page(page, size).list();
        List<ProcessoResponse> responses = processos.stream().map(this::toResponse).collect(Collectors.toList());

        return Response.ok(new PageResponse<>(responses, total, page, size)).build();

    }

    @GET
    @Path("/{id}")

    public Response buscar(@PathParam("id") Long id) {

        Long adminId = getAdminId();
        Processo processo = Processo.find("id = ?1 and adminId = ?2", id, adminId).firstResult();

        if (processo == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Processo não encontrado", uriInfo.getPath())).build();
        }

        return Response.ok(toResponse(processo)).build();

    }

    @POST
    @Transactional
    @RolesAllowed({"ADMIN", "EDIT"})

    public Response criar(@Valid ProcessoRequest request) {

        if (!canEdit()) {
            return Response.status(403).entity(new ErroResponse(403, "Proibido", "Você não tem permissão para criar processos", uriInfo.getPath())).build();
        }

        Long adminId = getAdminId();
        Cliente cliente = null;

        if (request.clienteId != null) {
            cliente = Cliente.find("id = ?1 and adminId = ?2", request.clienteId, adminId).firstResult();
        }

        Processo processo = new Processo();

        processo.adminId = adminId;
        processo.cliente = cliente;
        updateEntity(processo, request);

        processo.persist();
        logService.registrar(getUserId(),"CREATE","Processo", processo.id, "Criou processo: " + (processo.numeroProcesso != null ? processo.numeroProcesso : "sem número"), getClientIp(), getUserAgent());
        return Response.status(Response.Status.CREATED).entity(toResponse(processo)).build();
    
    }

    @PUT
    @Path("/{id}")
    @Transactional
    @RolesAllowed({"ADMIN", "EDIT"})

    public Response atualizar(@PathParam("id") Long id, @Valid ProcessoRequest request) {

        if (!canEdit()) {
            return Response.status(403).entity(new ErroResponse(403, "Proibido", "Você não tem permissão para editar processos", uriInfo.getPath())).build();
        }

        Long adminId = getAdminId();
        Processo processo = Processo.find("id = ?1 and adminId = ?2", id, adminId).firstResult();

        if (processo == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Processo não encontrado", uriInfo.getPath())).build();
        }

        Cliente cliente = null;

        if (request.clienteId != null) {
            cliente = Cliente.find("id = ?1 and adminId = ?2", request.clienteId, adminId).firstResult();
        }

        processo.cliente = cliente;
        String numeroAntigo = processo.numeroProcesso;
        updateEntity(processo, request);

        processo.persist();
        logService.registrar(getUserId(),"UPDATE","Processo", processo.id, "Atualizou processo: " + (numeroAntigo != null ? numeroAntigo : "sem número") + " -> " + (processo.numeroProcesso != null ? processo.numeroProcesso : "sem número"), getClientIp(), getUserAgent());
        return Response.ok(toResponse(processo)).build();
    
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    @RolesAllowed({"ADMIN", "EDIT"})

    public Response deletar(@PathParam("id") Long id) {

        if (!canEdit()) {
            return Response.status(403).entity(new ErroResponse(403, "Proibido", "Você não tem permissão para excluir processos", uriInfo.getPath())).build();
        }

        Long adminId = getAdminId();
        Processo processo = Processo.find("id = ?1 and adminId = ?2", id, adminId).firstResult();

        if (processo == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Processo não encontrado", uriInfo.getPath())).build();
        }

        String numero = processo.numeroProcesso;
        
        processo.delete();
        logService.registrar(getUserId(),"DELETE","Processo", id, "Deletou processo: " + (numero != null ? numero : "sem número"), getClientIp(), getUserAgent());
        return Response.noContent().build();

    }

    @GET
    @Path("/dashboard")

    public Response dashboard() {

        Long adminId = getAdminId();
        List<Processo> processos = Processo.find("adminId", adminId).list();

        long total = processos.size();
        long ativos = processos.stream().filter(p -> p.situacao == SituacaoProcesso.ATIVO).count();
        long inativos = processos.stream().filter(p -> p.situacao == SituacaoProcesso.INATIVO).count();

        java.math.BigDecimal totalHonorarios = processos.stream().filter(p -> p.honorarios != null).map(p -> p.honorarios).reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        java.math.BigDecimal maiorHonorario = processos.stream().filter(p -> p.honorarios != null).map(p -> p.honorarios).max(java.math.BigDecimal::compareTo).orElse(java.math.BigDecimal.ZERO);
        java.util.Map<RegimePrisional, Long> porRegime = processos.stream().filter(p -> p.regimePrisional != null).collect(Collectors.groupingBy(p -> p.regimePrisional, Collectors.counting()));

        long lapsoProximo = processos.stream().filter(Processo::isLapsoProximo).count();
        java.util.Map<String, Object> dashboard = new java.util.HashMap<>();

        dashboard.put("total", total);
        dashboard.put("ativos", ativos);
        dashboard.put("inativos", inativos);
        dashboard.put("totalHonorarios", totalHonorarios);
        dashboard.put("maiorHonorario", maiorHonorario);
        dashboard.put("porRegime", porRegime);
        dashboard.put("lapsoProximo", lapsoProximo);

        return Response.ok(dashboard).build();

    }

    @GET
    @Path("/alertas/lapso-proximo")

    public Response alertasLapsoProximo() {

        Long adminId = getAdminId();

        List<Processo> processos = Processo.find("adminId", adminId).list();
        List<ProcessoResponse> proximos = processos.stream().filter(Processo::isLapsoProximo).map(this::toResponse).collect(Collectors.toList());

        return Response.ok(proximos).build();

    }

    @GET
    @Path("/{id}/movimentacoes")

    public Response listarMovimentacoes(@PathParam("id") Long id) {

        Long adminId = getAdminId();
        Processo processo = Processo.find("id = ?1 and adminId = ?2", id, adminId).firstResult();

        if (processo == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Processo não encontrado", uriInfo.getPath())).build();
        }

        List<MovimentacaoResponse> responses = processo.movimentacoes.stream().map(m -> {

            MovimentacaoResponse r = new MovimentacaoResponse();

            r.id = m.id;
            r.data = m.data;
            r.descricao = m.descricao;

            return r;

        }).collect(Collectors.toList());

        return Response.ok(responses).build();

    }

    @POST
    @Path("/{id}/movimentacoes")
    @Transactional
    @RolesAllowed({"ADMIN", "EDIT"})

    public Response adicionarMovimentacao(@PathParam("id") Long id, @Valid MovimentacaoRequest request) {
        
        if (!canEdit()) {
            return Response.status(403).entity(new ErroResponse(403, "Proibido", "Você não tem permissão para adicionar movimentações", uriInfo.getPath())).build();
        }

        Long adminId = getAdminId();
        Processo processo = Processo.find("id = ?1 and adminId = ?2", id, adminId).firstResult();

        if (processo == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Processo não encontrado", uriInfo.getPath())).build();
        }

        Movimentacao movimentacao = new Movimentacao();

        movimentacao.processo = processo;
        movimentacao.data = request.data;
        movimentacao.descricao = request.descricao;

        movimentacao.persist();
        
        processo.movimentacoes.add(movimentacao);
        processo.persist();
        
        logService.registrar(getUserId(),"CREATE","Movimentação", movimentacao.id, "Adicionou movimentação ao processo " + (processo.numeroProcesso != null ? processo.numeroProcesso : "sem número") + ": " + request.descricao, getClientIp(), getUserAgent());
        MovimentacaoResponse response = new MovimentacaoResponse();

        response.id = movimentacao.id;
        response.data = movimentacao.data;
        response.descricao = movimentacao.descricao;

        return Response.status(Response.Status.CREATED).entity(response).build();

    }

    @PUT
    @Path("/{id}/movimentacoes/{movId}")
    @Transactional
    @RolesAllowed({"ADMIN", "EDIT"})

    public Response atualizarMovimentacao(@PathParam("id") Long id, @PathParam("movId") Long movId, @Valid MovimentacaoRequest request) {

        if (!canEdit()) {
            return Response.status(403).entity(new ErroResponse(403, "Proibido", "Você não tem permissão para editar movimentações", uriInfo.getPath())).build();
        }

        Long adminId = getAdminId();
        Processo processo = Processo.find("id = ?1 and adminId = ?2", id, adminId).firstResult();

        if (processo == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Processo não encontrado", uriInfo.getPath())).build();
        }

        Movimentacao movimentacao = Movimentacao.find("id = ?1 and processo.id = ?2", movId, id).firstResult();

        if (movimentacao == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Movimentação não encontrada", uriInfo.getPath())).build();
        }

        String descricaoAntiga = movimentacao.descricao;
        movimentacao.data = request.data;
        movimentacao.descricao = request.descricao;
        
        movimentacao.persist();
        logService.registrar(getUserId(),"UPDATE","Movimentação", movId, "Atualizou movimentação: " + descricaoAntiga + " -> " + request.descricao, getClientIp(), getUserAgent());

        MovimentacaoResponse response = new MovimentacaoResponse();

        response.id = movimentacao.id;
        response.data = movimentacao.data;
        response.descricao = movimentacao.descricao;
        
        return Response.ok(response).build();

    }

    @DELETE
    @Path("/{id}/movimentacoes/{movId}")
    @Transactional
    @RolesAllowed({"ADMIN", "EDIT"})

    public Response deletarMovimentacao(@PathParam("id") Long id, @PathParam("movId") Long movId) {

        if (!canEdit()) {
            return Response.status(403).entity(new ErroResponse(403, "Proibido", "Você não tem permissão para excluir movimentações", uriInfo.getPath())).build();
        }

        Long adminId = getAdminId();
        Processo processo = Processo.find("id = ?1 and adminId = ?2", id, adminId).firstResult();

        if (processo == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Processo não encontrado", uriInfo.getPath())).build();
        }

        Movimentacao movimentacao = Movimentacao.find("id = ?1 and processo.id = ?2", movId, id).firstResult();

        if (movimentacao == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Movimentação não encontrada", uriInfo.getPath())).build();
        }

        String descricao = movimentacao.descricao;
        processo.movimentacoes.remove(movimentacao);

        movimentacao.delete();
        logService.registrar(getUserId(),"DELETE","Movimentação", movId, "Excluiu movimentação: " + descricao, getClientIp(), getUserAgent());
        return Response.noContent().build();
    
    }

    @GET
    @Path("/prazos/hoje")

    public Response prazosHoje() {

        Long adminId = getAdminId();
        LocalDate hoje = LocalDate.now();
        List<Processo> processos = Processo.find("adminId = ?1 and prazoEmAberto = true and dataPrazo = ?2", adminId, hoje).list();

        List<Map<String, Object>> result = processos.stream().map(p -> {

            Map<String, Object> map = new java.util.HashMap<>();

            map.put("id", p.id);
            map.put("numeroProcesso", p.numeroProcesso);
            map.put("clienteNome", p.cliente != null ? p.cliente.nome : null);
            map.put("dataPrazo", p.dataPrazo);
            map.put("situacao", p.situacao);

            return map;

        }).collect(Collectors.toList());

        return Response.ok(result).build();

    }

    @GET
    @Path("/prazos/proximos")

    public Response prazosProximos() {

        Long adminId = getAdminId();
        LocalDate hoje = LocalDate.now();
        LocalDate daqui7Dias = hoje.plusDays(7);
        List<Processo> processos = Processo.find("adminId = ?1 and prazoEmAberto = true and dataPrazo >= ?2 and dataPrazo <= ?3 order by dataPrazo asc", adminId, hoje, daqui7Dias).list();

        List<Map<String, Object>> result = processos.stream().map(p -> {

            Map<String, Object> map = new java.util.HashMap<>();

            map.put("id", p.id);
            map.put("numeroProcesso", p.numeroProcesso);
            map.put("clienteNome", p.cliente != null ? p.cliente.nome : null);
            map.put("dataPrazo", p.dataPrazo);
            map.put("diasRestantes", java.time.temporal.ChronoUnit.DAYS.between(hoje, p.dataPrazo));
            map.put("situacao", p.situacao);
            
            return map;

        }).collect(Collectors.toList());

        return Response.ok(result).build();

    }

    @GET
    @Path("/prazos/em-aberto")

    public Response prazosEmAberto() {

        Long adminId = getAdminId();
        List<Processo> processos = Processo.find("adminId = ?1 and prazoEmAberto = true order by dataPrazo asc nulls last", adminId).list();
        long total = processos.size();

        List<Map<String, Object>> result = processos.stream().map(p -> {

            Map<String, Object> map = new java.util.HashMap<>();

            map.put("id", p.id);
            map.put("numeroProcesso", p.numeroProcesso);
            map.put("clienteNome", p.cliente != null ? p.cliente.nome : null);
            map.put("dataPrazo", p.dataPrazo);
            map.put("situacao", p.situacao);
            map.put("diasRestantes", p.dataPrazo != null ? java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), p.dataPrazo) : null);
            
            return map;
        
        }).collect(Collectors.toList());

        Map<String, Object> response = new java.util.HashMap<>();

        response.put("total", total);
        response.put("content", result);

        return Response.ok(response).build();

    }

    @GET
    @Path("/prazos/calendario")

    public Response prazosCalendario(@QueryParam("mes") Integer mes, @QueryParam("ano") Integer ano) {

        Long adminId = getAdminId();

        int mesFiltro = mes != null ? mes : LocalDate.now().getMonthValue();
        int anoFiltro = ano != null ? ano : LocalDate.now().getYear();

        LocalDate inicio = LocalDate.of(anoFiltro, mesFiltro, 1);
        LocalDate fim = inicio.withDayOfMonth(inicio.lengthOfMonth());

        List<Processo> processos = Processo.find("adminId = ?1 and prazoEmAberto = true and dataPrazo >= ?2 and dataPrazo <= ?3 order by dataPrazo asc", adminId, inicio, fim).list();
        Map<Integer, List<Map<String, Object>>> porDia = new java.util.LinkedHashMap<>();

        for (Processo p : processos) {

            if (p.dataPrazo == null) continue;

            int dia = p.dataPrazo.getDayOfMonth();
            porDia.computeIfAbsent(dia, k -> new java.util.ArrayList<>());

            Map<String, Object> item = new java.util.HashMap<>();

            item.put("id", p.id);
            item.put("numeroProcesso", p.numeroProcesso);
            item.put("clienteNome", p.cliente != null ? p.cliente.nome : null);
            item.put("situacao", p.situacao);

            porDia.get(dia).add(item);

        }

        Map<String, Object> response = new java.util.HashMap<>();

        response.put("mes", mesFiltro);
        response.put("ano", anoFiltro);
        response.put("total", processos.size());
        response.put("porDia", porDia);

        return Response.ok(response).build();
    }
    
    private ProcessoResponse toResponse(Processo entity) {

        ProcessoResponse response = new ProcessoResponse();

        response.id = entity.id;
        response.numeroProcesso = entity.numeroProcesso;
        response.situacao = entity.situacao;
        response.matriculaSap = entity.matriculaSap;
        response.regimePrisional = entity.regimePrisional;
        response.prazoEmAberto = entity.prazoEmAberto;
        response.dataPrazo = entity.dataPrazo;
        response.lapsoProgressao = entity.lapsoProgressao;
        response.honorarios = entity.honorarios;
        response.diasRestantesLapso = entity.getDiasRestantesLapso();
        response.lapsoProximo = entity.isLapsoProximo();
        response.createdAt = entity.createdAt;
        response.updatedAt = entity.updatedAt;

        if (entity.cliente != null) {

            response.clienteId = entity.cliente.id;
            response.clienteNome = entity.cliente.nome;

            if (entity.matriculaSap == null) {
                response.matriculaSap = entity.cliente.matriculaSap;
            }

            if (entity.regimePrisional == null) {
                response.regimePrisional = entity.cliente.regimePrisional;
            }

        }

        if (entity.movimentacoes != null) {

            response.movimentacoes = entity.movimentacoes.stream().map(m -> {

                MovimentacaoResponse r = new MovimentacaoResponse();

                r.id = m.id;
                r.data = m.data;
                r.descricao = m.descricao;
                
                return r;

            }).collect(Collectors.toList());

        }

        return response;

    }

    private void updateEntity(Processo entity, ProcessoRequest request) {

        entity.numeroProcesso = request.numeroProcesso;
        entity.situacao = request.situacao != null ? request.situacao : SituacaoProcesso.ATIVO;
        entity.prazoEmAberto = request.prazoEmAberto;
        entity.dataPrazo = request.dataPrazo;
        entity.lapsoProgressao = request.lapsoProgressao;
        entity.honorarios = request.honorarios;

        if (entity.cliente != null) {
            entity.matriculaSap = entity.cliente.matriculaSap;
            entity.regimePrisional = entity.cliente.regimePrisional;
        }

        if (request.movimentacoes != null) {

            entity.movimentacoes.clear();

            for (MovimentacaoRequest mr : request.movimentacoes) {
                
                Movimentacao m = new Movimentacao();

                m.processo = entity;
                m.data = mr.data;
                m.descricao = mr.descricao;

                entity.movimentacoes.add(m);

            }

        }

    }
}