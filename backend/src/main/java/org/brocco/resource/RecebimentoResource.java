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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Path("/financeiro/recebimentos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed({"ADMIN", "EDIT"})

public class RecebimentoResource {
    
    @Inject
    JsonWebToken jwt;

    @Inject
    AtividadeLogService logService;

    @Context
    HttpHeaders httpHeaders;

    @Context
    UriInfo uriInfo;

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

    @GET
    public Response listar(@QueryParam("page") @DefaultValue("0") int page, @QueryParam("size") @DefaultValue("10") int size, @QueryParam("dataInicio") String dataInicio, @QueryParam("dataFim") String dataFim, @QueryParam("tipo") String tipo, @QueryParam("recebido") String recebido, @QueryParam("search") String search) {

        Long adminId = getAdminId();
        StringBuilder query = new StringBuilder("adminId = ?1");
        List<Object> params = new ArrayList<>();

        params.add(adminId);

        if (dataInicio != null && !dataInicio.isEmpty()) {
            query.append(" and dataPrevistaRecebimento >= ?").append(params.size() + 1);
            params.add(LocalDate.parse(dataInicio));
        }

        if (dataFim != null && !dataFim.isEmpty()) {
            query.append(" and dataPrevistaRecebimento <= ?").append(params.size() + 1);
            params.add(LocalDate.parse(dataFim));
        }

        if (tipo != null && !tipo.isEmpty()) {

            try {
                TipoRecebimento tipoEnum = TipoRecebimento.valueOf(tipo.toUpperCase());
                query.append(" and tipo = ?").append(params.size() + 1);
                params.add(tipoEnum);
            } catch (IllegalArgumentException e) {
                System.out.println("error");
            }

        }

        if (recebido != null && !recebido.isEmpty()) {
            query.append(" and recebido = ?").append(params.size() + 1);
            params.add("SIM".equals(recebido));
        }

        if (search != null && !search.isEmpty()) {
            query.append(" and (lower(clienteNome) like ?").append(params.size() + 1);
            params.add("%" + search.toLowerCase() + "%");
            query.append(" or processoNumero like ?").append(params.size() + 1);
            params.add("%" + search + "%");
            query.append(")");
        }

        query.append(" order by dataPrevistaRecebimento desc");
        long total = Recebimento.find(query.toString(), params.toArray()).count();


        List<Recebimento> lista = Recebimento.find(query.toString(), params.toArray()).page(page, size).list();
        List<RecebimentoResponse> responseList = lista.stream().map(this::toResponse).collect(Collectors.toList());
        
        return Response.ok(new PageResponse<>(responseList, total, page, size)).build();

    }

    @GET
    @Path("/{id}")

    public Response buscar(@PathParam("id") Long id) {

        Long adminId = getAdminId();
        Recebimento entity = Recebimento.find("id = ?1 and adminId = ?2", id, adminId).firstResult();

        if (entity == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Recebimento não encontrado", uriInfo.getPath())).build();
        }

        return Response.ok(toResponse(entity)).build();

    }

    @POST
    @Transactional

    public Response criar(@Valid RecebimentoRequest request) {
        Long adminId = getAdminId();
        Recebimento entity = new Recebimento();
        entity.adminId = adminId;
        updateEntity(entity, request);
        entity.persist();
        logService.registrar(getUserId(),"CREATE","Recebimento", entity.id, "Criou recebimento: R$ " + entity.valor + " - " + entity.tipo.getDescricao(), getClientIp(), getUserAgent());
        return Response.status(Response.Status.CREATED).entity(toResponse(entity)).build();
    }

    @PUT
    @Path("/{id}")
    @Transactional

    public Response atualizar(@PathParam("id") Long id, @Valid RecebimentoRequest request) {
        
        Long adminId = getAdminId();
        Recebimento entity = Recebimento.find("id = ?1 and adminId = ?2", id, adminId).firstResult();

        if (entity == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Recebimento não encontrado", uriInfo.getPath())).build();
        }

        BigDecimal valorAntigo = entity.valor;

        updateEntity(entity, request);
        entity.persist();
        logService.registrar(getUserId(),"UPDATE","Recebimento", entity.id, "Atualizou recebimento: R$ " + valorAntigo + " -> R$ " + entity.valor, getClientIp(), getUserAgent());
        return Response.ok(toResponse(entity)).build();

    }

    @DELETE
    @Path("/{id}")
    @Transactional

    public Response deletar(@PathParam("id") Long id) {

        Long adminId = getAdminId();
        Recebimento entity = Recebimento.find("id = ?1 and adminId = ?2", id, adminId).firstResult();

        if (entity == null) {
            return Response.status(404).entity(new ErroResponse(404, "Não encontrado", "Recebimento não encontrado", uriInfo.getPath())).build();
        }

        String descricao = "R$ " + entity.valor + " - " + entity.tipo.getDescricao();
        entity.delete();
        logService.registrar(getUserId(),"DELETE","Recebimento", id, "Excluiu recebimento: " + descricao, getClientIp(), getUserAgent());
        return Response.noContent().build();

    }

    @GET
    @Path("/alertas/atrasados")
    
    public Response alertasAtrasados() {

        Long adminId = getAdminId();
        LocalDate hoje = LocalDate.now();
        List<Recebimento> atrasados = Recebimento.list("adminId = ?1 and recebido = false and dataPrevistaRecebimento < ?2", adminId, hoje);
        
        List<Map<String, Object>> result = atrasados.stream().map(r -> {

            Map<String, Object> map = new HashMap<>();

            map.put("id", r.id);
            map.put("valor", r.valor);
            map.put("tipo", r.tipo.getDescricao());
            map.put("clienteNome", r.clienteNome);
            map.put("dataPrevistaRecebimento", r.dataPrevistaRecebimento);
            map.put("diasAtraso", java.time.temporal.ChronoUnit.DAYS.between(r.dataPrevistaRecebimento, hoje));

            return map;

        }).collect(Collectors.toList());

        return Response.ok(result).build();

    }

    private RecebimentoResponse toResponse(Recebimento entity) {
    
        RecebimentoResponse response = new RecebimentoResponse();
    
        response.id = entity.id;
        response.dataPrevistaRecebimento = entity.dataPrevistaRecebimento;
        response.dataRecebimento = entity.dataRecebimento;
        response.valor = entity.valor;
        response.tipo = entity.tipo;
        response.recebido = entity.recebido;
        response.parcela = entity.parcela;
        response.clienteId = entity.clienteId;
        response.clienteNome = entity.clienteNome;
        response.processoId = entity.processoId;
        response.processoNumero = entity.processoNumero;
        response.detalhes = entity.detalhes;
        response.createdAt = entity.createdAt;
        response.updatedAt = entity.updatedAt;
        
        return response;
    
    }

    private void updateEntity(Recebimento entity, RecebimentoRequest request) {
        entity.dataPrevistaRecebimento = request.dataPrevistaRecebimento;
        entity.dataRecebimento = request.dataRecebimento;
        entity.valor = request.valor;
        entity.tipo = request.tipo;
        entity.recebido = request.recebido != null ? request.recebido : false;
        entity.parcela = request.parcela;
        entity.clienteId = request.clienteId;
        entity.clienteNome = request.clienteNome;
        entity.processoId = request.processoId;
        entity.processoNumero = request.processoNumero;
        entity.detalhes = request.detalhes;
    }
}